const express = require('express');
const Redis = require('ioredis');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// logging middleware (morgan -> stdout)
app.use(morgan('combined'));

// Redis client (cache)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
});

// Simulated payment endpoint
app.post('/pay', async (req, res) => {
  try {
    // simulate idempotency using payload or generate one
    const payloadId = req.body.idempotencyKey || uuidv4();
    const cacheKey = `pay:${payloadId}`;

    // check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('cache hit for', cacheKey);
      return res.json({ fromCache: true, result: JSON.parse(cached) });
    }

    // Simulate payment processing (fake delay)
    await new Promise(r => setTimeout(r, 500));

    const result = {
      status: 'OK',
      transactionId: uuidv4(),
      amount: req.body.amount || 10,
      timestamp: new Date().toISOString()
    };

    // cache result for 60 seconds (demo)
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);

    console.log('payment processed', result.transactionId);
    res.json({ fromCache: false, result });
  } catch (err) {
    console.error('payment error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// health
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(3000, () => {
  console.log('middleware listening on 3000');
});