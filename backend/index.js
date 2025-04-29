// app.js
const express = require('express');
const multer = require('multer');
const poRoutes = require('./routes/po');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/api/po', poRoutes);

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
