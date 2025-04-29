const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const mime = require('mime-types'); // New library to detect MIME types

const UNSTRACT_API_URL = "https://us-central.unstract.com/deployment/api/org_TVqffEyFhVLX91G2/extract-lines/";
const UNSTRACT_API_KEY = "9d8c55eb-1ea4-4bff-90f0-2155e478ea90";

/**
 * Send a file buffer (any type) to Unstruct AI
 * @param {Buffer} fileBuffer - The file content as a Buffer
 * @param {string} filename - The original filename (with extension)
 * @returns {Promise<Object>} extracted structured data
 */
exports.callUnstructAI = async (fileBuffer, filename) => {
  try {
    const form = new FormData();
    
    const contentType = mime.lookup(filename) || 'application/octet-stream'; // Guess the MIME type
    
    form.append('files', fileBuffer, {
      filename: filename,
      contentType: contentType,
    });
    form.append('timeout', '300');
    form.append('include_metadata', 'false');

    const response = await axios.post(UNSTRACT_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer 9d8c55eb-1ea4-4bff-90f0-2155e478ea90`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error) {
    console.error('Error calling Unstract AI:', error.response ? error.response.data : error.message);
    throw error;
  }
};
