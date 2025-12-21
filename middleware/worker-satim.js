// middleware/worker-satim.js
const axios = require('axios');
const Redis = require('ioredis');
const { Worker } = require('bullmq');
const { sequelize, Payment } = require('./db'); // Import sequelize and Payment model

const redisOpts = {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379
};
const redis = new Redis(redisOpts);

const SATIM_ACK_URL = process.env.SATIM_ACK_URL || 'https://test2.satim.dz/payment/rest/public/acknowledgeTransaction.do';
const SATIM_USERNAME = process.env.SATIM_USERNAME || 'SAT2511200956';
const SATIM_PASSWORD = process.env.SATIM_PASSWORD || 'satim120';

// dummy SAP endpoint (replace by your real SAP integration or enqueue to another queue)
const SAP_PUSH_URL = process.env.SAP_PUSH_URL || null;

const worker = new Worker('satim-ack', async job => {
  const { orderId } = job.data;
  try {
    // Call SATIM acknowledgeTransaction
    const params = new URLSearchParams({
      userName: SATIM_USERNAME,
      password: SATIM_PASSWORD,
      orderId
    });
    const url = `${SATIM_ACK_URL}?${params.toString()}`;
    const resp = await axios.get(url, { timeout: 15000 });
    const data = resp.data;

    // Find the payment in PostgreSQL
    const payment = await Payment.findByPk(orderId);
    if (!payment) {
      console.warn(`Payment with orderId ${orderId} not found in DB for SATIM ACK update.`);
      throw new Error(`Payment ${orderId} not found.`);
    }

    let newStatus = 'failed'; // Default to failed
    let sapResponse = null;
    let lastError = null;

    if (data.errorCode === 0) {
      newStatus = 'success'; // SATIM ACK successful
    } else {
      lastError = `SATIM ACK Error: ${data.errorMessage || 'Unknown error'}`;
    }

    // Optionally push to SAP (POST)
    if (SAP_PUSH_URL) {
      try {
        const sapResp = await axios.post(SAP_PUSH_URL, {
          orderId,
          satim: data
        }, { timeout: 10000 });
        sapResponse = sapResp.data;
        // Assuming SAP success means overall success, otherwise keep SATIM status
        if (sapResponse.success === false) { // Example check for SAP failure
          newStatus = 'failed';
          lastError = sapResponse.message || 'SAP push failed';
        }
      } catch (sapErr) {
        console.error('SAP push failed', sapErr.message || sapErr);
        newStatus = 'failed';
        lastError = `SAP Push Error: ${sapErr.message || sapErr}`;
      }
    }

    // Update payment record in PostgreSQL
    await payment.update({
      status: newStatus,
      satimAckDetails: data, // Store the full SATIM acknowledgement response
      sapResponse: sapResponse,
      lastError: lastError,
      actions: [...payment.actions, {
        timestamp: new Date().toISOString(),
        type: 'SATIM_ACKNOWLEDGED',
        details: { satimAck: data, sap: sapResponse, newStatus: newStatus, error: lastError }
      }]
    });

    // Also store in Redis for quick lookup by frontend if needed (optional, DB is source of truth)
    await redis.set(`payment:${orderId}`, JSON.stringify({ status: newStatus, result: data, sap: sapResponse, error: lastError }), 'EX', 60 * 60 * 24);

    return { ok: true, satimAck: data, sap: sapResponse, status: newStatus };
  } catch (err) {
    console.error('worker error ack', err.message || err);
    const payment = await Payment.findByPk(orderId);
    if (payment) {
      await payment.update({
        status: 'error',
        lastError: err.message || 'SATIM acknowledgement processing error',
        actions: [...payment.actions, {
          timestamp: new Date().toISOString(),
          type: 'SATIM_ACK_ERROR',
          details: { error: err.message || 'ack error' }
        }]
      });
    }
    throw err;
  }
}, { connection: redisOpts });

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

// Initialize database connection for the worker
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connection for worker established successfully.');
  })
  .catch(error => {
    console.error('Unable to connect to the database for worker:', error);
  });