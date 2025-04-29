import React, { useEffect, useState } from 'react';
import '../LandingAnimation.css'; // We'll define animations here
import CDIS from '../assets/CDIS.png';
import Endeavor from '../assets/EndeavorAI.jpeg';

function LandingAnimation({ onFinish }) {
  const [start, setStart] = useState(false);

  useEffect(() => {
    setStart(true);
    const timer = setTimeout(() => {
      onFinish(); // call parent to show main app
    }, 2500); // 2.5s animation duration

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="landing-container">
      <img src={CDIS} alt="CDIS" className={`logo logo-left ${start ? 'slide-in-left' : ''}`} />
      <img src={Endeavor} alt="Endeavor" className={`logo logo-right ${start ? 'slide-in-right' : ''}`} />
    </div>
  );
}

export default LandingAnimation;
