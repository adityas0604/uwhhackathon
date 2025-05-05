const express = require('express');
const client = require('prom-client');

const router = express.Router();

// Create a registry
const register = new client.Registry();

// Collect default system metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom counter for API requests
const apiRequestCounter = new client.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests received',
  labelNames: ['method', 'route', 'status']
});

register.registerMetric(apiRequestCounter);

// Middleware to track requests
router.use((req, res, next) => {
  const end = res.once('finish', () => {
    apiRequestCounter.labels(req.method, req.path, res.statusCode.toString()).inc();
  });
  next();
});

// Expose Prometheus metrics at /metrics
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

module.exports = router;
