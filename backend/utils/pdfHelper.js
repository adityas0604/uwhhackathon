const fs = require('fs');
const path = require('path');

/**
 * Move a file from its current location to the processed folder
 * @param {string} currentPath - The current full path of the file
 * @returns {Promise<string>} - The new path after moving
 */
exports.moveFileToProcessed = (currentPath) => {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(currentPath); // Extract just the filename
    const newPath = path.join('uploads/processed', fileName);

    fs.rename(currentPath, newPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(newPath);
      }
    });
  });
};

/**
 * (Optional Helper) List all PDF files from a given folder
 * Useful for Progress Page (to list documents)
 */
exports.listPDFFiles = (folderPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        // Filter only .pdf files
        const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
        resolve(pdfFiles);
      }
    });
  });
};
