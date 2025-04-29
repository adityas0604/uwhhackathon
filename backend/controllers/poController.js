exports.uploadPO = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
  
      res.status(200).json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        path: req.file.path
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error uploading file' });
    }
  };

  
  