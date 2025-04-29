const { callUnstructAI } = require('../services/llmService');
const { moveFileToProcessed, listFilesInFolder } = require('../utils/pdfHelper');
const fs = require('fs');
const path = require('path');

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
    console.error('Error uploading file:', err);
    res.status(500).json({ message: 'Error uploading file' });
  }
};


// Process Document API
exports.processDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/new', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const extractedData = await callUnstructAI(fileBuffer, filename);

    const newPath = await moveFileToProcessed(filePath);

    // Read uploadedFiles.json to get original filename
    const uploadMappingPath = path.join('uploads', 'uploadedFiles.json');
    let originalFilename = filename; // default fallback if not found

    if (fs.existsSync(uploadMappingPath)) {
      const rawData = fs.readFileSync(uploadMappingPath);
      let uploadedFiles = JSON.parse(rawData);

      if (Array.isArray(uploadedFiles)) {
        const fileEntry = uploadedFiles.find(file => file.backendFilename === filename);
        if (fileEntry) {
          originalFilename = fileEntry.originalFilename;
        }

        // Remove the processed file from uploadedFiles.json
        uploadedFiles = uploadedFiles.filter(file => file.backendFilename !== filename);
        fs.writeFileSync(uploadMappingPath, JSON.stringify(uploadedFiles, null, 2));
      }
    }

    // Save extracted structured output along with filenames
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
      originalFilename: originalFilename,
      extractedData: extractedData
    });

    fs.writeFileSync(structuredOutputsPath, JSON.stringify(structuredOutputs, null, 2));

    res.status(200).json({
      message: 'Document processed and structured output saved successfully',
      extractedData
    });
  } catch (err) {
    console.error('Error processing document:', err);
    res.status(500).json({ message: 'Error processing document' });
  }
};
// exports.listUploadedFiles = async (req, res) => {
//   try {
//     const folderPath = path.join('uploads', 'new');
//     const files = await listFilesInFolder(folderPath);

//     res.status(200).json({
//       message: 'Uploaded files fetched successfully',
//       files: files
//     });
//   } catch (err) {
//     console.error('Error fetching uploaded files:', err);
//     res.status(500).json({ message: 'Error fetching uploaded files' });
//   }
// };

exports.listUploadedFiles = async (req, res) => {
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
    console.error('Error fetching uploaded files:', err);
    res.status(500).json({ message: 'Error fetching uploaded files' });
  }
};



