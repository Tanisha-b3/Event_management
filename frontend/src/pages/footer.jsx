import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Compact Footer Content */}
        <div className="footer-grid">
          {/* Company Info and Social */}
          <div className="footer-col">
            <h3 className="footer-heading">EventPro</h3>
            <div className="social-links">
              <a href="https://facebook.com" aria-label="Facebook"><FaFacebook /></a>
              <a href="https://twitter.com" aria-label="Twitter"><FaTwitter /></a>
              <a href="https://instagram.com" aria-label="Instagram"><FaInstagram /></a>
              <a href="https://linkedin.com" aria-label="LinkedIn"><FaLinkedin /></a>
            </div>
          </div>

          {/* Minimal Links */}
          <div className="footer-col">
            <ul className="footer-links">
              <li><a href="/about">About</a></li>
              <li><a href="/events">Events</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Compact Copyright Section */}

      </div>
    </footer>
  );
};

export default Footer;