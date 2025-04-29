// app.js
const express = require('express');
const multer = require('multer');
const poRoutes = require('./routes/po');
require('dotenv').config();
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/po', poRoutes);

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
