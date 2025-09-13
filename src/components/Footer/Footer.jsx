import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          <div className="footer__logo">
            <Link to="/">
              <span className="logo-text">Handle</span>
            </Link>
            <p className="footer__tagline">
              Automate your job applications with AI
            </p>
          </div>
          
          <div className="footer__links">
            <div className="footer__section">
              <h4>Quick Links</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
            
            <div className="footer__section">
              <h4>Support</h4>
              <Link to="/help">Help Center</Link>
              <Link to="/feedback">Feedback</Link>
              <Link to="/faq">FAQ</Link>
            </div>
          </div>
        </div>
        
        <div className="footer__bottom">
          <p>&copy; 2024 Handle. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;