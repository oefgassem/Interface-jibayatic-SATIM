// middleware/worker-sap.js

const { Worker } = require('bullmq');
const { sequelize, Payment } = require('./db');
const { postPayment } = require('./sapClient');

// ---------------- REDIS ----------------
const redisOpts = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379)
};

// ---------------- WORKER ----------------
new Worker(
  'sap-post',
  async job => {
    const { orderId } = job.data;

    const payment = await Payment.findByPk(orderId);
    if (!payment) {
      throw new Error(`Payment ${orderId} not found`);
    }

    // Only post paid payments
    if (payment.status !== 'paid') {
      return;
    }

    try {
      // Mark SAP processing started
      await payment.update({
        status: 'sap_pending',
        sapLastTryAt: new Date()
      });

      // Call SAP
      const sapResponse = await postPayment({
        IvFbnum: payment.orderNumber,           // NUMÉRO DE LIASSE
        IvAmount: String(payment.amount/100),       // CENTS
        // IvGpart: payment.accountId,
        // IvAmount: String(payment.amount),
        IvDate: new Date().toISOString().slice(0, 10) + 'T00:00:00'
      });

      // Success
      await payment.update({
        status: 'sap_synced',
        sapSynced: true,
        sapResponse,
        sapRetryCount: payment.sapRetryCount + 1,
        actions: [
          ...payment.actions,
          {
            type: 'SAP_POST_OK',
            timestamp: new Date().toISOString(),
            details: sapResponse
          }
        ]
      });

    } catch (err) {
      // Failure
      await payment.update({
        status: 'sap_failed',
        sapRetryCount: payment.sapRetryCount + 1,
        sapLastTryAt: new Date(),
        lastError: err.message,
        actions: [
          ...payment.actions,
          {
            type: 'SAP_POST_FAILED',
            timestamp: new Date().toISOString(),
            details: err.message
          }
        ]
      });

      throw err; // Let BullMQ retry
    }
  },
  {
    connection: redisOpts,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 60_000 // 1 min
    }
  }
);

// ---------------- DB CONNECTION ----------------
sequelize.authenticate()
  .then(() => {
    console.log('SAP worker: PostgreSQL connected');
  })
  .catch(err => {
    console.error('SAP worker: DB connection failed', err);
    process.exit(1);
  });
