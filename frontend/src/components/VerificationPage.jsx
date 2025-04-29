import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';

function VerificationPage() {
  const [files, setFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [editedOutputs, setEditedOutputs] = useState({});
  const [savingFile, setSavingFile] = useState(null);

  useEffect(() => {
    fetchVerificationFiles();
  }, []);

  const fetchVerificationFiles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/po/verification');
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error fetching verification files:', error);
      alert('Error fetching verification files.');
    }
  };

  const handleEditClick = (backendFilename) => {
    if (editingFile === backendFilename) {
      // Cancel editing
      setEditingFile(null);
      setEditedOutputs(prev => {
        const updated = { ...prev };
        delete updated[backendFilename];
        return updated;
      });
    } else {
      setEditingFile(backendFilename);
    }
  };

  const handleOutputChange = (backendFilename, key, value) => {
    setEditedOutputs(prev => ({
      ...prev,
      [backendFilename]: {
        ...(prev[backendFilename] || {}),
        [key]: value
      }
    }));
  };

  const handleSave = async (backendFilename) => {
    try {
      setSavingFile(backendFilename);

      const originalFile = files.find(file => file.backendFilename === backendFilename);

      if (!originalFile) {
        alert('Original file not found.');
        return;
      }

      const updatedOutput = {
        ...originalFile.output,
        ...editedOutputs[backendFilename]
      };

      await axios.put(`http://localhost:8000/api/po/edit/${backendFilename}`, {
        output: updatedOutput
      });

      alert('Output saved successfully.');
      setEditingFile(null);
      setEditedOutputs(prev => {
        const updated = { ...prev };
        delete updated[backendFilename];
        return updated;
      });

      fetchVerificationFiles();
    } catch (error) {
      console.error('Error saving output:', error);
      alert('Error saving output.');
    } finally {
      setSavingFile(null);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-center">Verification Page</h2>

      {files.length === 0 ? (
        <p className="text-center">No processed files available.</p>
      ) : (
        <Row className="g-4">
          {files.map((file, idx) => (
            <Col key={idx} xs={12} sm={6} md={4}>
              <Card className="h-100 shadow-sm d-flex flex-column justify-content-between">
                <Card.Body>
                  <Card.Title className="text-center">{file.originalFilename}</Card.Title>

                  <Form>
                    {Object.entries(file.output).map(([key, value]) => (
                      <Form.Group key={key} className="mb-2">
                        <Form.Label style={{ fontWeight: 'bold' }}>{key}</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={
                            editingFile === file.backendFilename
                              ? editedOutputs[file.backendFilename]?.[key] ?? value
                              : value
                          }
                          disabled={editingFile !== file.backendFilename} // ✅ Only allow editing the selected card
                          onChange={(e) => handleOutputChange(file.backendFilename, key, e.target.value)}
                        />
                      </Form.Group>
                    ))}
                  </Form>
                </Card.Body>

                <Card.Footer className="bg-white border-0 d-flex justify-content-between">
                  <Button
                    variant={editingFile === file.backendFilename ? 'secondary' : 'primary'}
                    onClick={() => handleEditClick(file.backendFilename)}
                  >
                    {editingFile === file.backendFilename ? 'Cancel' : 'Edit'}
                  </Button>

                  <Button
                    variant="success"
                    disabled={
                      !editedOutputs[file.backendFilename] ||
                      editingFile !== file.backendFilename
                    }
                    onClick={() => handleSave(file.backendFilename)}
                  >
                    {savingFile === file.backendFilename ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                    ) : null}
                    Save
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

export default VerificationPage;
