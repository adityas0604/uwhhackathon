import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';

function ProgressPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingFile, setProcessingFile] = useState(null); // Track currently processing file

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/po/uploads');
        setFiles(response.data.files);
      } catch (error) {
        console.error('Error fetching files:', error);
        alert('Error fetching uploaded files.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleProcess = async (backendFilename) => {
    try {
      setProcessingFile(backendFilename);

      await axios.post(`http://localhost:8000/api/po/process/${backendFilename}`);

      alert('Document processed successfully!');
      // After processing, remove the file from the list
      setFiles(prevFiles => prevFiles.filter(file => file.backendFilename !== backendFilename));
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Error processing document.');
    } finally {
      setProcessingFile(null);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-center">Uploaded Files</h2>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <Spinner animation="border" role="status" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-center">No uploaded files found.</p>
      ) : (
        <Row className="g-4">
          {files.map((file, idx) => (
            <Col key={idx} xs={12} sm={6} md={4} lg={3}>
              <Card className="h-100 shadow-sm d-flex flex-column justify-content-between">
                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                  <Card.Text className="text-center">
                    <strong>{file.originalFilename}</strong>
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="bg-white border-0 text-center">
                  <Button
                    variant="success"
                    onClick={() => handleProcess(file.backendFilename)}
                    disabled={processingFile !== null} // ✅ Disable all buttons if any file is being processed
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
      )}
    </Container>
  );
}

export default ProgressPage;
