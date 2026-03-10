import React from "react";

export default function Cookies() {
  return (
    <div className="landing-page" style={{minHeight: '100vh'}}>
      <div className="animated-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>
      <div style={{padding: '3rem 1rem', maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1}}>
        <h1 className="hero-title" style={{color: '#8e8ac7', textAlign: 'center'}}>Cookies Policy</h1>
        <p style={{color: '#8aa4c7', fontSize: '1.1rem', marginTop: '2rem', textAlign: 'center'}}>This is the Cookies Policy page. Add your cookies policy details here.</p>
      </div>
    </div>
  );
}
