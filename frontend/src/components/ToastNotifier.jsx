import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

function ToastNotifier({ show, message, onClose, title = 'Notification', variant = 'light' }) {
  return (
    <ToastContainer position="top-end" className="p-3">
      <Toast bg={variant} show={show} onClose={onClose} delay={3000} autohide>
        <Toast.Header closeButton>
          <strong className="me-auto">{title}</strong>
        </Toast.Header>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export default ToastNotifier;
