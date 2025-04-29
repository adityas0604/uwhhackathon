import React, { useState } from 'react';
import { Button, Form, Spinner, Card } from 'react-bootstrap';
import axios from 'axios';

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/po/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('File uploaded successfully!');
      setSelectedFile(null); // Clear file
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: 'calc(100vh - 56px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        textAlign: 'center'
      }}
    >
      <Form.Group controlId="formFile" className="mb-3">
        <Form.Label style={{ cursor: 'pointer' }}>
          {selectedFile ? (
            // ✅ Show pretty filename card when file selected
            <Card 
              style={{
                width: '250px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                border: '2px solid #ced4da'
              }}
            >
              <Card.Body>
                <Card.Text>
                  <strong>Selected File:</strong> <br />
                  {selectedFile.name}
                </Card.Text>
              </Card.Body>
            </Card>
          ) : (
            // ✅ Show plus button if no file selected
            <div
              style={{
                width: '200px',
                height: '200px',
                border: '2px dashed gray',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '50px',
                color: 'gray',
                margin: '0 auto'
              }}
            >
              +
            </div>
          )}
        </Form.Label>
        <Form.Control
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </Form.Group>

      <Button
        variant="primary"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Uploading...
          </>
        ) : (
          'Upload'
        )}
      </Button>
    </div>
  );
}

export default UploadPage;
