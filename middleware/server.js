// middleware/server.js

const express = require('express');
const morgan = require('morgan');
const Redis = require('ioredis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Queue, Worker } = require('bullmq'); // Added Worker, though not directly used in server.js, useful for worker-satim.js
const { Sequelize, DataTypes } = require('sequelize'); // Import Sequelize and DataTypes
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
const redis = new Redis(redisOpts);

// POSTGRESQL SETUP
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Set to true to see SQL queries in console, useful for debugging
  }
);

// Define Payment Model
const Payment = sequelize.define('Payment', {
  orderId: { type: DataTypes.STRING, primaryKey: true, allowNull: false, unique: true },
  orderNumber: { type: DataTypes.STRING, allowNull: false }, // The original order number from the frontend
  amount: { type: DataTypes.INTEGER, allowNull: false }, // Store in smallest currency unit (e.g., cents)
  currency: { type: DataTypes.STRING(3), allowNull: false }, // e.g., '012' for DZD
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' }, // e.g., 'registered', 'pending', 'success', 'failed', 'refunded'
  retries: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  satimResponse: { type: DataTypes.JSONB, allowNull: true }, // Store the full initial SATIM registration response
  actions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] }, // Array of action objects { timestamp, type, details }
}, {
  tableName: 'payments', // Explicitly set table name
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

// This utility function will now interact with the database
// It's designed to update a payment record and append an action to its history
// The worker-satim.js will also need a similar function or direct model access.
async function updatePaymentRecord(orderId, updates, actionType, actionDetails = {}) {
  // This function will be used by the worker-satim.js to update payment status
  // For server.js, we primarily use Payment.create and Payment.findByPk
  // However, it's good to have a consistent update mechanism.
  try {
    const payment = await Payment.findByPk(orderId);
    if (!payment) {
      console.warn(`Payment with orderId ${orderId} not found for update.`);
      return null;
    }

    const newActions = [...payment.actions, {
      timestamp: new Date().toISOString(),
      type: actionType,
      details: actionDetails,
    }];

    await payment.update({ ...updates, actions: newActions });
    return payment;
  } catch (error) {
    console.error(`Error updating payment record for orderId ${orderId}:`, error);
    throw error; // Re-throw to be handled by caller
  }
}

// QUEUE (BullMQ)
const ackQueue = new Queue('satim-ack', { connection: redisOpts });

// SATIM CONFIG
const SATIM_REGISTER_URL = process.env.SATIM_REGISTER_URL || 'https://test2.satim.dz/payment/rest/register.do';
const SATIM_ACK_URL = process.env.SATIM_ACK_URL || 'https://test2.satim.dz/payment/rest/public/acknowledgeTransaction.do';
const SATIM_USERNAME = process.env.SATIM_USERNAME || 'SAT2511200956';
const SATIM_PASSWORD = process.env.SATIM_PASSWORD || 'satim120';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

// ----------- TEST ENDPOINT (OLD PAY) -----------
app.post('/api/pay', async (req, res) => {
  try {
    const payloadId = req.body.idempotencyKey || uuidv4();
    const cacheKey = `pay:${payloadId}`;
    const cached = await redis.get(cacheKey);

    if (cached) return res.json({ fromCache: true, result: JSON.parse(cached) });

    await new Promise(r => setTimeout(r, 500));

    const result = {
      status: 'OK',
      transactionId: uuidv4(),
      amount: req.body.amount || 10,
      timestamp: new Date().toISOString()
    };

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
    res.json({ fromCache: false, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

// ----------- SATIM REGISTER PAYMENT -----------
app.post('/api/satim/register', async (req, res) => {
  try {
    const { orderNumber, amount, currency = '012', language = 'FR', returnUrl, failUrl } = req.body;
    if (!orderNumber || !amount || !returnUrl || !failUrl)
      return res.status(400).json({ error: 'orderNumber, amount, returnUrl, failUrl required' });

    const params = new URLSearchParams({
      userName: SATIM_USERNAME,
      password: SATIM_PASSWORD,
      orderNumber,
      amount: String(amount),
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
      amount: amount,
      currency: currency,
      status: 'registered', // Initial status
      retries: 0,
      satimResponse: data, // Store the full SATIM response for reference
      actions: [{ // Record the initial action
        timestamp: new Date().toISOString(),
        type: 'registered',
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

// ----------- PAYMENT STATUS (from DB) -----------
app.get('/api/payment-status', async (req, res) => {
  const orderId = req.query.orderId;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  try {
    // Fetch payment record from PostgreSQL
    const payment = await Payment.findByPk(orderId, {
      // Select specific attributes to return, excluding potentially sensitive full satimResponse
      attributes: ['orderId', 'orderNumber', 'amount', 'currency', 'status', 'retries', 'createdAt', 'updatedAt', 'actions']
    });

    if (!payment) {
      return res.status(404).json({ status: 'not_found', message: 'Payment not found' });
    }
    return res.json(payment);
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
    return sequelize.sync(); // This will create the 'payments' table if it doesn't exist
  })
  .then(() => {
    console.log('Payment model synced with database.');
    app.listen(3000, () => console.log('SATIM middleware running on port 3000'));
  })
  .catch(error => {
    console.error('Unable to connect to the database or sync models:', error);
    process.exit(1); // Exit if database connection fails, as the app cannot function without it
  });
