// middleware/server.js

const express = require('express');
const morgan = require('morgan');
const Redis = require('ioredis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Queue } = require('bullmq');
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

// QUEUE (BullMQ)
const ackQueue = new Queue('satim-ack', { connection: redisOpts });

// SATIM CONFIG
const SATIM_REGISTER_URL = process.env.SATIM_REGISTER_URL || 'https://test2.satim.dz/payment/rest/register.do';
const SATIM_ACK_URL = process.env.SATIM_ACK_URL || 'https://test2.satim.dz/payment/rest/public/acknowledgeTransaction.do';
const SATIM_USERNAME = process.env.SATIM_USERNAME || 'SAT2511200956';
const SATIM_PASSWORD = process.env.SATIM_PASSWORD || 'satim120';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

// UTILS
async function setPaymentStatus(orderId, payload) {
  await redis.set(`payment:${orderId}`, JSON.stringify(payload), 'EX', 86400);
}

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

    await setPaymentStatus(data.orderId, { status: 'registered', orderNumber, amount, satimResponse: data });

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

// ----------- PAYMENT STATUS ----------- 
app.get('/api/payment-status', async (req, res) => {
  const orderId = req.query.orderId;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  const raw = await redis.get(`payment:${orderId}`);
  if (!raw) return res.json({ status: 'unknown' });

  return res.json(JSON.parse(raw));
});

// HEALTH
app.get('/api/health', (_, res) => res.json({ ok: true }));

// START SERVER
app.listen(3000, () => console.log('SATIM middleware running on port 3000'));
