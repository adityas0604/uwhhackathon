import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavbarComponent from './components/Navbar';
import UploadPage from './components/UploadPage';
import ProgressPage from './components/ProgressPage';

function App() {
  return (
    <Router>
      <NavbarComponent />
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        {/* We'll add ProgressPage and VerificationPage routes later */}
      </Routes>
    </Router>
  );
}

export default App;
