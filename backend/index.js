// app.js
const express = require('express');
const multer = require('multer');
const poRoutes = require('./routes/po');
const client = require("prom-client");
require('dotenv').config();
const cors = require('cors');
const { router: metricsRouter, totalRequestCounter } = require('./metrics.js');



const app = express();
app.use(cors());
app.use(express.json());

// Middleware to count each request except for /metrics
const excludedRoutes = ['/metrics', '/health', '/favicon.ico'];

app.use((req, res, next) => {
    if (!excludedRoutes.includes(req.path)) {
      totalRequestCounter.inc();
    }
    next();
  });
  
//app.use(requestCountMiddleware);
app.use('/api/po', poRoutes);
app.use('/metrics', metricsRouter);




const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));