const fs = require('fs');
const path = require('path');
const { callUnstructAI } = require('../services/llmService');
const { moveFileToProcessed } = require('../utils/pdfHelper');
const {
  stats,
  updateUnprocessed,
  updateProcessed,
  incrementProcessed,
  incrementReverified
} = require('../utils/statsStore.js');

// Upload a file
exports.uploadPO = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const backendFilename = req.file.filename;
    const originalFilename = req.file.originalname;
    const uploadMappingPath = path.join('uploads', 'uploadedFiles.json');
    let uploadedFiles = [];

    if (fs.existsSync(uploadMappingPath)) {
      const rawData = fs.readFileSync(uploadMappingPath);
      uploadedFiles = JSON.parse(rawData);
    }

    uploadedFiles.push({ backendFilename, originalFilename });
    fs.writeFileSync(uploadMappingPath, JSON.stringify(uploadedFiles, null, 2));

    // Update unprocessed file count
    const newFiles = fs.readdirSync('uploads/new');
    updateUnprocessed(newFiles.length);

    res.status(200).json({
      message: 'File uploaded successfully',
      backendFilename,
      originalFilename,
      path: req.file.path
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ message: 'Error uploading file' });
  }
};

// Process a document
exports.processDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/new', filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

    const fileBuffer = fs.readFileSync(filePath);
    const extractedData = await callUnstructAI(fileBuffer, filename);
    const newPath = await moveFileToProcessed(filePath);

    // Read original filename
    const uploadMappingPath = path.join('uploads', 'uploadedFiles.json');
    let uploadedFiles = [];
    let originalFilename = filename;

    if (fs.existsSync(uploadMappingPath)) {
      const rawData = fs.readFileSync(uploadMappingPath);
      uploadedFiles = JSON.parse(rawData);
      const entry = uploadedFiles.find(f => f.backendFilename === filename);
      if (entry) originalFilename = entry.originalFilename;

      uploadedFiles = uploadedFiles.filter(f => f.backendFilename !== filename);
      fs.writeFileSync(uploadMappingPath, JSON.stringify(uploadedFiles, null, 2));
    }

    const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
    let structuredOutputs = [];

    if (fs.existsSync(structuredOutputsPath)) {
      const rawData = fs.readFileSync(structuredOutputsPath);
      structuredOutputs = JSON.parse(rawData);
    }

    structuredOutputs.push({
      backendFilename: filename,
      originalFilename,
      extractedData
    });

    fs.writeFileSync(structuredOutputsPath, JSON.stringify(structuredOutputs, null, 2));

    // Update stats
    const newFiles = fs.readdirSync('uploads/new');
    const processedFiles = fs.readdirSync('uploads/processed');
    updateUnprocessed(newFiles.length);
    updateProcessed(processedFiles.length);
    incrementProcessed();

    res.status(200).json({ message: 'Document processed', extractedData });
  } catch (err) {
    console.error('Error processing document:', err);
    res.status(500).json({ message: 'Error processing document' });
  }
};

// Reverify a document
exports.reverifyDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const processedPath = path.join('uploads/processed', filename);
    const newPath = path.join('uploads/new', filename);
    if (!fs.existsSync(processedPath)) return res.status(404).json({ message: 'Processed file not found' });

    fs.renameSync(processedPath, newPath);

    // Remove from structuredOutputs
    const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
    let structuredOutputs = [];
    if (fs.existsSync(structuredOutputsPath)) {
      const rawData = fs.readFileSync(structuredOutputsPath);
      structuredOutputs = JSON.parse(rawData);
    }

    const originalEntry = structuredOutputs.find(entry => entry.backendFilename === filename);
    const updatedOutputs = structuredOutputs.filter(entry => entry.backendFilename !== filename);
    fs.writeFileSync(structuredOutputsPath, JSON.stringify(updatedOutputs, null, 2));

    // Add back to uploadedFiles.json
    const uploadedFilesPath = path.join('uploads', 'uploadedFiles.json');
    let uploadedFiles = [];
    if (fs.existsSync(uploadedFilesPath)) {
      const rawData = fs.readFileSync(uploadedFilesPath);
      uploadedFiles = JSON.parse(rawData);
    }

    if (originalEntry) {
      uploadedFiles.push({
        backendFilename: filename,
        originalFilename: originalEntry.originalFilename
      });
      fs.writeFileSync(uploadedFilesPath, JSON.stringify(uploadedFiles, null, 2));
    }

    // Update stats
    const newFiles = fs.readdirSync('uploads/new');
    const processedFiles = fs.readdirSync('uploads/processed');
    updateUnprocessed(newFiles.length);
    updateProcessed(processedFiles.length);
    incrementReverified();

    res.status(200).json({ message: 'Document sent for reverification' });
  } catch (err) {
    console.error('Error during reverification:', err);
    res.status(500).json({ message: 'Error during reverification' });
  }
};

// Return uploaded files still in 'new' state
exports.listUploadedFiles = async (req, res) => {
  try {
    const uploadMappingPath = path.join('uploads', 'uploadedFiles.json');
    let uploadedFiles = [];

    if (fs.existsSync(uploadMappingPath)) {
      const rawData = fs.readFileSync(uploadMappingPath);
      uploadedFiles = JSON.parse(rawData);
    }

    res.status(200).json({
      message: 'Uploaded files fetched successfully',
      files: uploadedFiles
    });
  } catch (err) {
    console.error('Error fetching uploaded files:', err);
    res.status(500).json({ message: 'Error fetching uploaded files' });
  }
};

// Return verification files (processed)
exports.getVerificationFiles = async (req, res) => {
  try {
    const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
    let structuredOutputs = [];

    if (fs.existsSync(structuredOutputsPath)) {
      const rawData = fs.readFileSync(structuredOutputsPath);
      structuredOutputs = JSON.parse(rawData);
    }

    const formatted = structuredOutputs.map(entry => ({
      backendFilename: entry.backendFilename,
      originalFilename: entry.originalFilename,
      output: entry.extractedData?.message?.result?.[0]?.result?.output || {}
    }));

    res.status(200).json({ files: formatted });
  } catch (err) {
    console.error('Error fetching verification files:', err);
    res.status(500).json({ message: 'Error fetching verification files.' });
  }
};

// Edit an output
exports.editOutput = async (req, res) => {
  try {
    const { filename } = req.params;
    const { output } = req.body;
    if (!output || typeof output !== 'object') {
      return res.status(400).json({ message: 'Invalid output format' });
    }

    const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
    let structuredOutputs = [];

    if (fs.existsSync(structuredOutputsPath)) {
      const rawData = fs.readFileSync(structuredOutputsPath);
      structuredOutputs = JSON.parse(rawData);
    }

    const index = structuredOutputs.findIndex(entry => entry.backendFilename === filename);
    if (index === -1) return res.status(404).json({ message: 'Document not found' });

    structuredOutputs[index].extractedData.message.result[0].result.output = output;
    fs.writeFileSync(structuredOutputsPath, JSON.stringify(structuredOutputs, null, 2));

    res.status(200).json({ message: 'Output updated successfully' });
  } catch (err) {
    console.error('Error editing output:', err);
    res.status(500).json({ message: 'Error editing output' });
  }
};

// Download original file
exports.downloadFile = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join('uploads', 'processed', filename);
  if (fs.existsSync(filePath)) return res.download(filePath);
  res.status(404).json({ message: 'File not found' });
};

// Download extracted output JSON
exports.downloadOutput = (req, res) => {
  const { filename } = req.params;
  const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
  if (!fs.existsSync(structuredOutputsPath)) {
    return res.status(404).json({ message: 'Structured outputs not found' });
  }

  const rawData = fs.readFileSync(structuredOutputsPath);
  const outputs = JSON.parse(rawData);
  const entry = outputs.find(e => e.backendFilename === filename);

  if (entry && entry.extractedData?.message?.result?.[0]?.result?.output) {
    res.setHeader('Content-Disposition', `attachment; filename=${filename}-output.json`);
    res.json(entry.extractedData.message.result[0].result.output);
  } else {
    res.status(404).json({ message: 'Output not found' });
  }
};

// Return live dashboard stats
exports.getStats = (req, res) => {
  res.status(200).json(stats);
};


