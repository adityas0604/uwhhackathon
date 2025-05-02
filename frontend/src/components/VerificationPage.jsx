import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, ListGroup } from 'react-bootstrap';
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

  const handleLineItemChange = (backendFilename, index, newValue) => {
    setEditedOutputs(prev => {
      const fileEdits = prev[backendFilename] ?? {};
      return {
        ...prev,
        [backendFilename]: {
          ...fileEdits,
          [index]: newValue
        }
      };
    });
  };

  const handleSave = async (backendFilename) => {
    try {
      setSavingFile(backendFilename);

      const originalFile = files.find(file => file.backendFilename === backendFilename);
      if (!originalFile) {
        alert('Original file not found.');
        return;
      }

      const originalLines = originalFile.output.extarct_line;
      const editedLines = editedOutputs[backendFilename] || {};
      const mergedLines = originalLines.map((line, idx) => {
        if (editedLines[idx]) {
          try {
            return JSON.parse(editedLines[idx]);
          } catch (e) {
            alert(`Line item ${idx + 1} has invalid JSON.`);
            throw e;
          }
        }
        return line;
      });

      const updatedOutput = {
        ...originalFile.output,
        extarct_line: mergedLines
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

  const downloadFile = (backendFilename) => {
    window.open(`http://localhost:8000/api/po/download/file/${backendFilename}`, '_blank');
  };

  const downloadOutput = (backendFilename) => {
    window.open(`http://localhost:8000/api/po/download/output/${backendFilename}`, '_blank');
  };

  const handleReverify = async (backendFilename) => {
    try {
      await axios.post(`http://localhost:8000/api/po/reverify/${backendFilename}`);
      alert('File sent back for reverification.');
      fetchVerificationFiles();
    } catch (error) {
      console.error('Error sending file for reverification:', error);
      alert('Error during reverification.');
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
            <Col key={idx} xs={12} sm={6} md={6}>
              <Card className="h-100 shadow-sm" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <Card.Body>
                  <Card.Title className="text-center mb-3">{file.originalFilename}</Card.Title>
                  {Array.isArray(file.output.extarct_line) &&
                    file.output.extarct_line.map((lineItem, lineIdx) => {
                      const isEditing = editingFile === file.backendFilename;
                      const value = isEditing && editedOutputs[file.backendFilename]?.[lineIdx]
                        ? editedOutputs[file.backendFilename][lineIdx]
                        : JSON.stringify(lineItem, null, 2);

                      return (
                        <Card className="mb-2" key={lineIdx} style={{ backgroundColor: '#f9f9f9', fontSize: '0.9rem' }}>
                          <Card.Header><strong>Line Item #{lineIdx + 1}</strong></Card.Header>
                          <Card.Body style={{ padding: '10px' }}>
                            {isEditing ? (
                              <Form.Control
                                as="textarea"
                                rows={4}
                                style={{ fontSize: '0.85rem' }}
                                value={value}
                                onChange={(e) => handleLineItemChange(file.backendFilename, lineIdx, e.target.value)}
                              />
                            ) : (
                              <ListGroup variant="flush">
                                {Object.entries(lineItem).map(([key, val]) => (
                                  <ListGroup.Item key={key} style={{ padding: '4px 8px' }}>
                                    <strong>{key}:</strong> {val || '—'}
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            )}
                          </Card.Body>
                        </Card>
                      );
                    })}
                </Card.Body>

                <Card.Footer className="bg-white border-0 d-flex flex-column gap-2 p-3">
                  <div className="d-flex justify-content-between">
                    <Button
                      variant={editingFile === file.backendFilename ? 'secondary' : 'primary'}
                      onClick={() => handleEditClick(file.backendFilename)}
                    >
                      {editingFile === file.backendFilename ? 'Cancel' : 'Edit'}
                    </Button>

                    <Button
                      variant="warning"
                      onClick={() => handleReverify(file.backendFilename)}
                    >
                      Reprocess
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
                  </div>

                  <div className="d-flex justify-content-between">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => downloadFile(file.backendFilename)}
                    >
                      Download File
                    </Button>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => downloadOutput(file.backendFilename)}
                    >
                      Download Output
                    </Button>
                  </div>
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