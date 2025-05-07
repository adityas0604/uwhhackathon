import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Spinner, ListGroup, ButtonGroup, Dropdown
} from 'react-bootstrap';
import axios from 'axios';
import ToastNotifier from '../components/ToastNotifier';

function VerificationPage() {
  const [files, setFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [editedOutputs, setEditedOutputs] = useState({});
  const [savingFile, setSavingFile] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchVerificationFiles();
    const interval = setInterval(() => fetchVerificationFiles(), 5000);
    return () => clearInterval(interval);
  }, []);



  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const fetchVerificationFiles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/po/verification');
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error fetching verification files:', error);
      showNotification('❌ Error fetching verification files.');
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
        showNotification('⚠️ Original file not found.');
        return;
      }

      const originalLines = originalFile.output.extarct_line;
      const editedLines = editedOutputs[backendFilename] || {};
      const mergedLines = originalLines.map((line, idx) => {
        if (editedLines[idx]) {
          try {
            return JSON.parse(editedLines[idx]);
          } catch (e) {
            showNotification(`❌ Line item ${idx + 1} has invalid JSON.`);
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

      showNotification('✅ Output saved successfully.');
      setEditingFile(null);
      setEditedOutputs(prev => {
        const updated = { ...prev };
        delete updated[backendFilename];
        return updated;
      });

      fetchVerificationFiles();
    } catch (error) {
      console.error('Error saving output:', error);
      showNotification('❌ Error saving output.');
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
      showNotification('🔁 File sent back for reverification.');
      fetchVerificationFiles();
    } catch (error) {
      console.error('Error sending file for reverification:', error);
      showNotification('❌ Error during reverification.');
    }
  };

  return (
    <>
      <Container className="mt-5">
        <h2 className="mb-4 text-center">Verification Page</h2>

        {files.length === 0 ? (
          <p className="text-center">No processed files available.</p>
        ) : (
          <Row className="g-4"  >
            {files.map((file, idx) => (
              <Col key={idx} xs={12} sm={6} md={6}>
                <Card className="h-60 shadow-sm d-flex flex-column" style={{ height: '75vh' }}>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    {file.originalFilename}

                    <Dropdown as={ButtonGroup}>
                      <Dropdown.Toggle variant="outline-primary" size="sm">
                        📥 Download
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => downloadFile(file.backendFilename)}>
                          📄 Download File
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => downloadOutput(file.backendFilename)}>
                          📊 Download Output
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Card.Header>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {Array.isArray(file.output.extarct_line) &&
                      file.output.extarct_line.map((lineItem, lineIdx) => {
                        const isEditing = editingFile === file.backendFilename;
                        const value = isEditing && editedOutputs[file.backendFilename]?.[lineIdx]
                          ? editedOutputs[file.backendFilename][lineIdx]
                          : JSON.stringify(lineItem, null, 2);

                        return (
                          <div key={lineIdx} className="border-bottom p-2" style={{ backgroundColor: '#f9f9f9' }}>
                            <h6 className="mb-1"><strong>Line Item #{lineIdx + 1}</strong></h6>
                            {isEditing ? (
                              <Form.Control
                                as="textarea"
                                rows={6}
                                style={{
                                  fontSize: '0.95rem',
                                  minHeight: '150px',    // Minimum height
                                  maxHeight: '300px',    // Max height for scroll
                                  overflowY: 'auto'      // Scrollable if content overflows
                                }}
                                value={value}
                                onChange={(e) => handleLineItemChange(file.backendFilename, lineIdx, e.target.value)}
                              />
                            ) : (
                              <ListGroup variant="flush">
                                {Object.entries(lineItem).map(([key, val]) => (
                                  <ListGroup.Item key={key} className="py-1 px-2">
                                    {key}: {val || '—'}
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  <Card.Footer className="bg-grey border-0 d-flex flex-column gap-2 p-2">
                    {/* Primary Actions */}
                    <div className="d-flex justify-content-between mb-2">
                      <Button
                        variant={editingFile === file.backendFilename ? 'secondary' : 'primary'}
                        onClick={() => handleEditClick(file.backendFilename)}
                        size="sm"
                        className="me-2"
                      >
                        {editingFile === file.backendFilename ? '✏️ Cancel' : '✏️ Edit'}
                      </Button>

                      <Button
                        variant="warning"
                        onClick={() => handleReverify(file.backendFilename)}
                        size="sm"
                        className="me-2"
                      >
                        🔄 Reprocess
                      </Button>

                      <Button
                        variant="success"
                        disabled={
                          !editedOutputs[file.backendFilename] ||
                          editingFile !== file.backendFilename
                        }
                        onClick={() => handleSave(file.backendFilename)}
                        size="sm"
                      >
                        💾 Save
                      </Button>
                    </div>

              
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      <ToastNotifier
        show={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
        title="Verification"
        variant="light"
      />
    </>
  );
}

export default VerificationPage;