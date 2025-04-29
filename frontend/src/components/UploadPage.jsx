import React, { useState } from 'react';
import { Button, Form, Spinner, Card, Container } from 'react-bootstrap';
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
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      style={{
        height: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        backgroundColor: '#fefefe',
        textAlign: 'center'
      }}
    >
      <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Upload Your Document
      </h2>
      <p style={{ maxWidth: '600px', marginBottom: '2rem', color: '#666' }}>
        This tool helps you process purchase orders and extract structured data
        using AI. Upload a document to begin the workflow.
      </p>

      <Form.Group controlId="formFile" className="mb-3">
        <Form.Label style={{ cursor: 'pointer' }}>
          {selectedFile ? (
            <Card
              style={{
                width: '280px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                border: '2px dashed #ced4da',
                textAlign: 'center'
              }}
            >
              <Card.Body>
                <Card.Text>
                  <strong>Selected File:</strong>
                  <br />
                  {selectedFile.name}
                </Card.Text>
              </Card.Body>
            </Card>
          ) : (
            <div
              style={{
                width: '220px',
                height: '220px',
                border: '2px dashed #6c757d',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '3rem',
                color: '#6c757d',
                backgroundColor: '#fafafa',
                transition: '0.3s'
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
        style={{ width: '150px' }}
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
    </Container>
  );
}

export default UploadPage;
