import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NavbarComponent() {
  return (
    <div style={{ width: '100%', backgroundColor: '#212529' }}>
      <Navbar bg="dark" variant="dark" expand="lg" className="px-3">
        <Container fluid>
        <Navbar.Brand as={Link} to="/">Document Processor</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
          <Nav.Link as={Link} to="/">Dashboard</Nav.Link> {/* ✅ Updated */}
          <Nav.Link as={Link} to="/verification">Verification</Nav.Link>
          </Nav>
        </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
}

export default NavbarComponent;
