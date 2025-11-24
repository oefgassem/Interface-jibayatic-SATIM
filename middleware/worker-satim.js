// middleware/worker-satim.js
const axios = require('axios');
const Redis = require('ioredis');
const { Worker } = require('bullmq');

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

async function storeResult(orderId, payload) {
  const key = `payment:${orderId}`;
  // mark as done and store payload
  await redis.set(key, JSON.stringify({ status: 'done', result: payload }), 'EX', 60 * 60 * 24);
}

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

    // store in redis
    await storeResult(orderId, data);

    // Optionally push to SAP (POST)
    if (SAP_PUSH_URL) {
      try {
        await axios.post(SAP_PUSH_URL, {
          orderId,
          satim: data
        }, { timeout: 10000 });
      } catch (sapErr) {
        console.error('SAP push failed', sapErr.message || sapErr);
        // you may want to retry or push to a dead-letter queue
      }
    }

    return { ok: true, data };
  } catch (err) {
    console.error('worker error ack', err.message || err);
    // mark as failed in redis
    await storeResult(job.data.orderId, { error: err.message || 'ack error' });
    throw err;
  }
}, { connection: redisOpts });

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});