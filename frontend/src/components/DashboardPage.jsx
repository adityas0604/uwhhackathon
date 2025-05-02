import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Form, Spinner, Card } from 'react-bootstrap';
import axios from 'axios';

function DashboardPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processingFile, setProcessingFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/po/uploads');
      setUploadedFiles(response.data.files);
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert('Please select a file to upload.');

    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);

    try {
      await axios.post('http://localhost:8000/api/po/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('File uploaded successfully!');
      setSelectedFile(null);
      fetchUploadedFiles();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
  };

  const handleProcess = async (filename) => {
    try {
      setProcessingFile(filename);
      await axios.post(`http://localhost:8000/api/po/process/${filename}`);
      alert('Document processed successfully!');
      fetchUploadedFiles();
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Processing failed.');
    } finally {
      setProcessingFile(null);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4 fw-bold text-start" style={{ fontSize: '1.75rem' }}>
        Dashboard
      </h2>

      <Card className="mb-5 p-4 shadow-sm">
        <h5 className="mb-3 fw-semibold text-start">Upload a Document</h5>

        <Form.Group controlId="formFile" className="mb-3 d-flex flex-column align-items-center">
          <Form.Label style={{ cursor: 'pointer', width: '100%' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '240px',
                height: '200px',
                border: '2px dashed #6c757d',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.1rem',
                color: '#6c757d',
                backgroundColor: '#fafafa',
                transition: '0.3s',
                padding: '1rem',
                textAlign: 'center',
                margin: '0 auto'
              }}
            >
              {selectedFile ? (
                <div>
                  <strong>Selected File:</strong>
                  <br />
                  {selectedFile.name}
                </div>
              ) : (
                '+'
              )}
            </div>
          </Form.Label>
          <Form.Control type="file" onChange={handleFileChange} style={{ display: 'none' }} />
        </Form.Group>

        {selectedFile && (
          <div className="d-flex justify-content-center gap-3">
            <Button variant="success" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
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
            <Button variant="danger" onClick={handleCancel} disabled={uploading}>
              Cancel
            </Button>
          </div>
        )}
      </Card>

      <h5 className="mb-3 fw-semibold text-start">Uploaded Files (Pending Processing)</h5>
      <Row className="g-4">
        {uploadedFiles.map((file, idx) => (
          <Col key={idx} xs={12} sm={6} md={4}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center">
                <Card.Title className="text-center">
                  {file.originalFilename}
                </Card.Title>
                <Card.Text style={{ fontSize: '0.85em', color: 'gray' }}>
                  {file.backendFilename}
                </Card.Text>
              </Card.Body>
              <Card.Footer className="text-center">
                <Button
                  variant="success"
                  onClick={() => handleProcess(file.backendFilename)}
                  disabled={processingFile !== null}
                >
                  {processingFile === file.backendFilename ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Processing...
                    </>
                  ) : (
                    'Process'
                  )}
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default DashboardPage;
