import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavbarComponent from './components/Navbar';
import VerificationPage from './components/VerificationPage';
import LandingAnimation from './components/LandingAnimation';
import DashboardPage from './components/DashboardPage'; 

function App() {
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    const alreadyVisited = localStorage.getItem('landingShown');
    if (alreadyVisited) {
      setShowApp(true); // skip animation
    }
  }, []);

  const handleAnimationFinish = () => {
    localStorage.setItem('landingShown', 'true'); // remember this visit
    setShowApp(true);
  };

  return (
    <>
      {!showApp ? (
        <LandingAnimation onFinish={handleAnimationFinish} />
      ) : (
        <Router>
          <NavbarComponent />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/verification" element={<VerificationPage />} />
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;
