const express = require('express');
const multer = require('multer');
const path = require('path');
const poController = require('../controllers/poController');

const router = express.Router();

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/new');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Route: POST /api/po/upload
router.post('/upload', upload.single('file'), poController.uploadPO);
router.post('/process/:filename', poController.processDocument);
router.get('/uploads', poController.listUploadedFiles);
router.post('/reverify/:filename', poController.reverifyDocument);
router.get('/verification', poController.getVerificationFiles);
router.put('/edit/:filename', poController.editOutput);




module.exports = router;
