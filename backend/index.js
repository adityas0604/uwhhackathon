// app.js
const express = require('express');
const multer = require('multer');
const poRoutes = require('./routes/po');
const client = require("prom-client");
require('dotenv').config();
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

function requestCountMiddleware(req, res, next){
    res.on('finish', () => {
        requestCounter.inc({
            method: req.method,
            route: req.path,
            status_code: res.statusCode
        });
    });

    next();
};

app.use(requestCountMiddleware);
app.use('/api/po', poRoutes);

app.get("/metrics", async (req, res) => {
    const metrics = await client.register.metrics();
    res.set('Content-Type', client.register.contentType);
    res.end(metrics);
})

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));