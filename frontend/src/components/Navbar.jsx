// Navigation bar component with Whisprite branding and tagline
import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="navbar-logo-icon"></div>
          <span className="navbar-title">Whisprite</span>
        </div>
        <div className="navbar-tagline">AI-Powered Video Captions</div>
      </div>
    </nav>
  );
};

export default Navbar;

