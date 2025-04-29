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
 * List all files in a folder
 * @param {string} folderPath
 * @returns {Promise<string[]>} Array of filenames
 */
exports.listFilesInFolder = (folderPath) => {
    return new Promise((resolve, reject) => {
      fs.readdir(folderPath, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  };
