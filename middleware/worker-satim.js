// middleware/worker-satim.js

const axios = require('axios');
const { Worker, Queue } = require('bullmq');
const { sequelize, Payment } = require('./db');

// ---------------- REDIS ----------------
const redisOpts = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379)
};

// Queue used to trigger SAP posting
const sapQueue = new Queue('sap-post', { connection: redisOpts });

// ---------------- SATIM CONFIG ----------------
const SATIM_ACK_URL =
  process.env.SATIM_ACK_URL ||
  'https://test2.satim.dz/payment/rest/public/acknowledgeTransaction.do';

const SATIM_USERNAME = process.env.SATIM_USERNAME || 'SAT2511200956';
const SATIM_PASSWORD = process.env.SATIM_PASSWORD || 'satim120';

// ---------------- WORKER ----------------
new Worker(
  'satim-ack',
  async job => {
    const { orderId } = job.data;

    // Call SATIM acknowledgeTransaction
    const params = new URLSearchParams({
      userName: SATIM_USERNAME,
      password: SATIM_PASSWORD,
      orderId
    });

    const resp = await axios.get(
      `${SATIM_ACK_URL}?${params.toString()}`,
      { timeout: 15000 }
    );

    const data = resp.data;

    // Load payment from DB
    const payment = await Payment.findByPk(orderId);
    if (!payment) {
      throw new Error(`Payment ${orderId} not found`);
    }

    // Robust SATIM success detection
    const isSuccess =
      data?.params?.respCode === '00' ||
      data?.actionCode === 0 ||
      data?.ErrorCode === '0' ||
      data?.ErrorCode === 0 ||
      data?.OrderStatus === 2;

    if (isSuccess) {
      // Payment confirmed by SATIM
      await payment.update({
        status: 'paid',
        satimAckDetails: data,
        lastError: null,
        actions: [
          ...payment.actions,
          {
            type: 'SATIM_ACK_OK',
            timestamp: new Date().toISOString(),
            details: data
          }
        ]
      });

      // Enqueue SAP posting
      await sapQueue.add('post-to-sap', { orderId });

    } else {
      // SATIM reported payment failure
      await payment.update({
        status: 'error',
        satimAckDetails: data,
        lastError: 'SATIM ACK failed',
        actions: [
          ...payment.actions,
          {
            type: 'SATIM_ACK_FAILED',
            timestamp: new Date().toISOString(),
            details: data
          }
        ]
      });
    }

    return { ok: true };
  },
  {
    connection: redisOpts,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 60_000 // 1 minute
    }
  }
);

// ---------------- SAFETY LOGS ----------------
process.on('unhandledRejection', err => {
  console.error('Unhandled rejection in SATIM worker:', err);
});

// ---------------- DB CONNECTION ----------------
sequelize.authenticate()
  .then(() => {
    console.log('SATIM worker: PostgreSQL connected');
  })
  .catch(err => {
    console.error('SATIM worker: DB connection failed', err);
    process.exit(1);
  });
