// middleware/server.js

const express = require('express');
const morgan = require('morgan');
const Redis = require('ioredis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Queue } = require('bullmq');
const { sequelize, Payment } = require('./db'); // Import sequelize and Payment model from db.js
const cors = require('cors');


// EXPRESS SETUP
const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(morgan('combined'));

app.use(cors({ origin: ['http://frontend.docker.localhost', 'http://localhost'] }));

// REDIS
const redisOpts = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
};

// QUEUE (BullMQ)
const ackQueue = new Queue('satim-ack', { connection: redisOpts });

// SATIM CONFIG
const SATIM_REGISTER_URL = process.env.SATIM_REGISTER_URL || 'https://test2.satim.dz/payment/rest/register.do';
const SATIM_ACK_URL = process.env.SATIM_ACK_URL || 'https://test2.satim.dz/payment/rest/public/acknowledgeTransaction.do';
const SATIM_USERNAME = process.env.SATIM_USERNAME || 'SAT2511200956';
const SATIM_PASSWORD = process.env.SATIM_PASSWORD || 'satim120';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

// ----------- SATIM REGISTER PAYMENT -----------
app.post('/api/satim/register', async (req, res) => {
  try {
    const { orderNumber, amount, accountId, currency = '012', language = 'FR', returnUrl, failUrl } = req.body;
    if (!orderNumber || !amount || !accountId || !returnUrl || !failUrl)
      return res.status(400).json({ error: 'orderNumber, amount, accountId, returnUrl, failUrl required' });

    const params = new URLSearchParams({
      userName: SATIM_USERNAME,
      password: SATIM_PASSWORD,
      orderNumber,
      amount: String(amount*100),
      currency,
      returnUrl,
      failUrl,
      language
    });

    const url = `${SATIM_REGISTER_URL}?${params.toString()}`;
    const satimResp = await axios.get(url, { timeout: 15000 });
    const data = satimResp.data;

    if (data.errorCode !== 0)
      return res.status(500).json({ error: 'SATIM register failed', data });

    // Save initial payment record to PostgreSQL
    await Payment.create({
      orderId: data.orderId,
      orderNumber: orderNumber,
      accountId: accountId,
      amount: amount,
      currency: currency,
      status: 'registered',
      retryCount: 0, // Initial retry count
      satimRegisterResponse: data, // Store the full SATIM registration response
      actions: [{ // Record the initial action
        timestamp: new Date().toISOString(),
        type: 'SATIM_REGISTERED',
        details: { satimResponse: data }
      }]
    });

    return res.json({ orderId: data.orderId, formUrl: data.formUrl });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: err.message });
  }
});

// ----------- SATIM RETURN CALLBACK -----------
app.get('/api/satim/return', async (req, res) => {
  const orderId = req.query.orderId || req.query.mdOrder;
  if (!orderId) return res.status(400).send('orderId missing');

  await ackQueue.add('acknowledge', { orderId }, { jobId: uuidv4() });

  const redirectUrl = `${FRONTEND_URL}/result?orderId=${orderId}`;
  return res.send(`
    <html>
      <meta http-equiv="refresh" content="0; url=${redirectUrl}" />
      <body>Redirecting to <a href="${redirectUrl}">result</a>...</body>
    </html>
  `);
});

// ----------- API to fetch all payments -----------
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.findAll({
      order: [['createdAt', 'DESC']] // Order by creation date, newest first
    });
    return res.json(payments);
  } catch (error) {
    console.error('Error fetching all payments:', error);
    return res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

// ----------- API to fetch a single payment status (from DB) -----------
app.get('/api/payments/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    // Fetch payment record from PostgreSQL
    const payment = await Payment.findByPk(orderId, {
      // Select specific attributes to return
      attributes: [
        'orderId', 'orderNumber', 'accountId', 'amount', 'currency', 'status', 'retryCount',
        'createdAt', 'updatedAt', 'actions', 'satimRegisterResponse', 'satimAckDetails',
        'sapResponse', 'lastError'
      ]
    });

    if (!payment) {
      return res.status(404).json({ status: 'not_found', message: 'Payment not found' });
    }
    return res.json(payment.toJSON()); // Return plain JSON object
  } catch (error) {
    console.error(`Error fetching payment status for orderId ${orderId}:`, error);
    return res.status(500).json({ error: 'Failed to retrieve payment status' });
  }
});

// ----------- API to manually retry a payment -----------
app.post('/api/payments/:orderId/retry', async (req, res) => {
  const { orderId } = req.params;
  try {
    const payment = await Payment.findByPk(orderId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update status to 'pending' or 'received' and increment retryCount
    await payment.update({
      status: 'registered', // Or 'pending', depending on your desired retry flow
      retryCount: payment.retryCount + 1,
      lastError: null, // Clear previous error on retry
      actions: [...payment.actions, {
        timestamp: new Date().toISOString(),
        type: 'MANUAL_RETRY',
        details: { previousStatus: payment.status, newRetryCount: payment.retryCount + 1 }
      }]
    });
    // Re-enqueue the acknowledgement job for this orderId
    console.log('[QUEUE] SATIM ACK enqueued', orderId);
    await ackQueue.add('acknowledge', { orderId }, { jobId: uuidv4() });

    return res.json({ message: 'Payment retry initiated', payment: payment.toJSON() });
  } catch (error) {
    console.error(`Error fetching payment status for orderId ${orderId}:`, error);
    return res.status(500).json({ error: 'Failed to retrieve payment status' });
  }
});

// HEALTH
app.get('/api/health', (_, res) => res.json({ ok: true }));

// START SERVER
// Initialize database connection and sync models before starting the Express server
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connection has been established successfully.');
    return sequelize.sync({ alter: true }); // This will alter the table to add new columns like 'retryCount'
  })
  .then(() => {
    console.log('Payment model synced with database.');
    app.listen(3000, () => console.log('SATIM middleware running on port 3000'));
  })
  .catch(error => {
    console.error('Unable to connect to the database or sync models:', error);
    process.exit(1); // Exit if database connection fails, as the app cannot function without it
  });