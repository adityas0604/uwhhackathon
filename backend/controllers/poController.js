const { callUnstructAI } = require('../services/llmService');
const { moveFileToProcessed, listFilesInFolder } = require('../utils/pdfHelper');
const fs = require('fs');
const path = require('path');
const processingQueue = require('../queues/processingQueue.js');
const logger = require('../logger.js');

// Upload API
// exports.uploadPO = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     res.status(200).json({
//       message: 'File uploaded successfully',
//       filename: req.file.filename,
//       path: req.file.path
//     });
//   } catch (err) {
//     console.error('Error uploading file:', err);
//     res.status(500).json({ message: 'Error uploading file' });
//   }
// };

//Upload API with file mappings
exports.uploadPO = async (req, res) => {
  logger.info('Received file upload request ', {
    filename: req.file ? req.file.filename : 'No file',
    originalname: req.file ? req.file.originalname : 'No original name'
  });
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const backendFilename = req.file.filename;
    const originalFilename = req.file.originalname;
    const uploadMappingPath = path.join('uploads', 'uploadedFiles.json');
    let uploadedFiles = [];

    // Load existing mapping
    if (fs.existsSync(uploadMappingPath)) {
      const rawData = fs.readFileSync(uploadMappingPath);
      const parsedData = JSON.parse(rawData);
      if (Array.isArray(parsedData)) {
        uploadedFiles = parsedData;
      }
    }

    // Add new upload mapping
    uploadedFiles.push({
      backendFilename,
      originalFilename
    });

    // Save updated mapping
    fs.writeFileSync(uploadMappingPath, JSON.stringify(uploadedFiles, null, 2));

    res.status(200).json({
      message: 'File uploaded successfully',
      backendFilename: backendFilename,
      originalFilename: originalFilename,
      path: req.file.path
    });
  } catch (err) {
    logger.error(error.message);
    console.error('Error uploading file:', err);
    res.status(500).json({ message: 'Error uploading file' });
  }
};

exports.processDocument = async (req, res) => {
  logger.info('Received document processing request', {
    filename: req.params.filename
  });
  try {
    const { filename } = req.params;

    const uploadMappingPath = path.join('uploads', 'uploadedFiles.json');

    // ✅ Update processing: true
    if (fs.existsSync(uploadMappingPath)) {
      const rawData = fs.readFileSync(uploadMappingPath);
      let uploadedFiles = JSON.parse(rawData);

      uploadedFiles = uploadedFiles.map(file =>
        file.backendFilename === filename
          ? { ...file, processing: true }
          : file
      );

      fs.writeFileSync(uploadMappingPath, JSON.stringify(uploadedFiles, null, 2));
    }

    await processingQueue.add('process-file', { backendFilename: filename });

    res.status(202).json({ message: 'File added to processing queue' });
  } catch (err) {
    logger.error(err.message) 
    console.error('Error adding to queue:', err);
    res.status(500).json({ message: 'Failed to enqueue document' });
  }
};

// Process Document API
exports.runDocumentProcessing = async (filename) => {
  logger.info('Running document processing', {
    filename: filename
  });
  const filePath = path.join('uploads/new', filename);

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }

  const fileBuffer = fs.readFileSync(filePath);
  const extractedData = await callUnstructAI(fileBuffer, filename);
  const newPath = await moveFileToProcessed(filePath);

  // Find original filename from uploadedFiles.json
  const uploadMappingPath = path.join('uploads', 'uploadedFiles.json');
  let originalFilename = filename;

  if (fs.existsSync(uploadMappingPath)) {
    const rawData = fs.readFileSync(uploadMappingPath);
    let uploadedFiles = JSON.parse(rawData);

    if (Array.isArray(uploadedFiles)) {
      const fileEntry = uploadedFiles.find(file => file.backendFilename === filename);
      if (fileEntry) {
        originalFilename = fileEntry.originalFilename;
      }

      uploadedFiles = uploadedFiles.filter(file => file.backendFilename !== filename);
      fs.writeFileSync(uploadMappingPath, JSON.stringify(uploadedFiles, null, 2));
    }
  }

  // Save structured output
  const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
  let structuredOutputs = [];

  if (fs.existsSync(structuredOutputsPath)) {
    const rawData = fs.readFileSync(structuredOutputsPath);
    const parsedData = JSON.parse(rawData);
    if (Array.isArray(parsedData)) {
      structuredOutputs = parsedData;
    }
  }

  structuredOutputs.push({
    backendFilename: filename,
    originalFilename,
    extractedData
  });

  fs.writeFileSync(structuredOutputsPath, JSON.stringify(structuredOutputs, null, 2));
};

exports.listUploadedFiles = async (req, res) => {
  logger.info('Listing uploaded files');
  try {
    const uploadMappingPath = path.join('uploads', 'uploadedFiles.json');
    let uploadedFiles = [];

    if (fs.existsSync(uploadMappingPath)) {
      const rawData = fs.readFileSync(uploadMappingPath);
      const parsedData = JSON.parse(rawData);
      if (Array.isArray(parsedData)) {
        uploadedFiles = parsedData;
      }
    }

    res.status(200).json({
      message: 'Uploaded files fetched successfully',
      files: uploadedFiles
    });
  } catch (err) {
    logger.error(err.message)
    console.error('Error fetching uploaded files:', err);
    res.status(500).json({ message: 'Error fetching uploaded files' });
  }
};


exports.reverifyDocument = async (req, res) => {
  logger.info('Received document reverification request', {
    filename: req.params.filename
  });
  try {
    const { filename } = req.params;

    const processedPath = path.join('uploads', 'processed', filename);
    const newPath = path.join('uploads', 'new', filename);

    // Check if file exists in processed folder
    if (!fs.existsSync(processedPath)) {
      return res.status(404).json({ message: 'Processed file not found.' });
    }

    // Move file back to uploads/new
    fs.renameSync(processedPath, newPath);

    // Load and update structuredOutputs.json
    const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
    let structuredOutputs = [];

    if (fs.existsSync(structuredOutputsPath)) {
      const rawData = fs.readFileSync(structuredOutputsPath);
      const parsedData = JSON.parse(rawData);
      if (Array.isArray(parsedData)) {
        structuredOutputs = parsedData;
      }
    }

    // Find and remove the document entry from structuredOutputs.json
    const updatedOutputs = structuredOutputs.filter(entry => entry.backendFilename !== filename);
    fs.writeFileSync(structuredOutputsPath, JSON.stringify(updatedOutputs, null, 2));

    // Add the file info back to uploadedFiles.json
    const uploadedFilesPath = path.join('uploads', 'uploadedFiles.json');
    let uploadedFiles = [];

    if (fs.existsSync(uploadedFilesPath)) {
      const rawData = fs.readFileSync(uploadedFilesPath);
      const parsedData = JSON.parse(rawData);
      if (Array.isArray(parsedData)) {
        uploadedFiles = parsedData;
      }
    }

    // Find originalFilename from structuredOutputs (before removal)
    const originalEntry = structuredOutputs.find(entry => entry.backendFilename === filename);

    if (originalEntry) {
      uploadedFiles.push({
        backendFilename: filename,
        originalFilename: originalEntry.originalFilename
      });
    }

    fs.writeFileSync(uploadedFilesPath, JSON.stringify(uploadedFiles, null, 2));

    res.status(200).json({ message: 'Document sent back for reverification.' });
  } catch (err) {
    logger.error(err.message)
    console.error('Error during reverification:', err);
    res.status(500).json({ message: 'Error sending document for reverification.' });
  }
};


exports.getVerificationFiles = async (req, res) => {
  logger.info('Fetching verification files');
  try {
    const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
    let structuredOutputs = [];

    // Load structuredOutputs.json
    if (fs.existsSync(structuredOutputsPath)) {
      const rawData = fs.readFileSync(structuredOutputsPath);
      const parsedData = JSON.parse(rawData);
      if (Array.isArray(parsedData)) {
        structuredOutputs = parsedData;
      }
    }

    // Map structured outputs to only necessary fields
    const formattedOutputs = structuredOutputs.map(entry => {
      let outputData = {};

      try {
        outputData = entry.extractedData?.message?.result?.[0]?.result?.output || {};
      } catch (error) {
        console.error('Error extracting output for file:', entry.backendFilename);
      }

      return {
        backendFilename: entry.backendFilename,
        originalFilename: entry.originalFilename,
        output: outputData
      };
    });

    res.status(200).json({ files: formattedOutputs });
  } catch (err) {
    logger.error(err.message)
    console.error('Error fetching verification files:', err);
    res.status(500).json({ message: 'Error fetching verification files.' });
  }
};


exports.editOutput = async (req, res) => {
  logger.info('Editing output for file', {
    filename: req.params.filename
  });
  try {
    const { filename } = req.params;
    const { output } = req.body;

    if (!output || typeof output !== 'object') {
      return res.status(400).json({ message: 'Invalid output provided.' });
    }

    const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');
    let structuredOutputs = [];

    // Load structuredOutputs.json
    if (fs.existsSync(structuredOutputsPath)) {
      const rawData = fs.readFileSync(structuredOutputsPath);
      const parsedData = JSON.parse(rawData);
      if (Array.isArray(parsedData)) {
        structuredOutputs = parsedData;
      }
    }

    // Find the document to edit
    const fileIndex = structuredOutputs.findIndex(entry => entry.backendFilename === filename);

    if (fileIndex === -1) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Update ONLY the output section
    if (structuredOutputs[fileIndex]?.extractedData?.message?.result?.[0]?.result) {
      structuredOutputs[fileIndex].extractedData.message.result[0].result.output = output;
    } else {
      return res.status(400).json({ message: 'Invalid document structure for editing.' });
    }

    // Save updated structuredOutputs.json
    fs.writeFileSync(structuredOutputsPath, JSON.stringify(structuredOutputs, null, 2));

    res.status(200).json({ message: 'Output updated successfully.' });
  } catch (err) {
    logger.error(err.message)
    console.error('Error editing output:', err);
    res.status(500).json({ message: 'Error editing output.' });
  }
};

exports.downloadFile = (req, res) => {
  logger.info('Downloading file', {
    filename: req.params.filename
  });
  const { filename } = req.params;
  const filePath = path.join('uploads', 'processed', filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    logger.error('File not found', {
      filename: filename
    });
    res.status(404).json({ message: 'File not found.' });
  }
};

exports.downloadOutput = (req, res) => {
  logger.info('Downloading output for file', {
    filename: req.params.filename
  });
  const { filename } = req.params;
  const structuredOutputsPath = path.join('uploads', 'structuredOutputs.json');

  if (fs.existsSync(structuredOutputsPath)) {
    const rawData = fs.readFileSync(structuredOutputsPath);
    const structuredOutputs = JSON.parse(rawData);

    const fileEntry = structuredOutputs.find(entry => entry.backendFilename === filename);

    if (fileEntry && fileEntry.extractedData?.message?.result?.[0]?.result?.output) {
      const outputData = fileEntry.extractedData.message.result[0].result.output;
      
      res.setHeader('Content-Disposition', `attachment; filename=${filename}-output.json`);
      res.json(outputData);
    } else {
      logger.error('Output not found for file', {
        filename: filename
      });
      res.status(404).json({ message: 'Output not found.' });
    }
  } else {
    logger.error('Structured outputs file not found');
    res.status(404).json({ message: 'Structured outputs not found.' });
  }
};

exports.deleteUploadedFile = async (req, res) => {
  logger.info('Deleting uploaded file', {
    filename: req.params.filename
  });
  try {
    const { filename } = req.params;
    const uploadPath = path.join('uploads', 'new', filename);
    const uploadedFilesPath = path.join('uploads', 'uploadedFiles.json');

    // 1. Remove the file from disk
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }

    // 2. Remove from uploadedFiles.json
    let uploadedFiles = [];
    if (fs.existsSync(uploadedFilesPath)) {
      const raw = fs.readFileSync(uploadedFilesPath);
      uploadedFiles = JSON.parse(raw);
      uploadedFiles = uploadedFiles.filter(file => file.backendFilename !== filename);
      fs.writeFileSync(uploadedFilesPath, JSON.stringify(uploadedFiles, null, 2));
    }

    res.status(200).json({ message: 'File and record deleted successfully.' });
  } catch (err) {
    logger.error(err.message)
    console.error('Delete failed:', err);
    res.status(500).json({ message: 'Error deleting file.' });
  }
};

