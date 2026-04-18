import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaGithub, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="app-bottom">
      <div className="app-bottom__inner">
        {/* Brand Section */}
        <div className="app-bottom__section">
          <div className="company-marker">
            <span className="company-marker__badge">EP</span>
            <span className="company-marker__title">EventPro</span>
          </div>
          <p className="app-bottom__slogan">Your gateway to amazing events</p>
          <p className="app-bottom__description">
            Creating unforgettable experiences since 2015. 
            We connect people through extraordinary events worldwide.
          </p>
          <div className="social-grid">
            <a href="#" className="social-grid__node" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" className="social-grid__node" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" className="social-grid__node" aria-label="Facebook"><FaFacebook /></a>
            <a href="#" className="social-grid__node" aria-label="LinkedIn"><FaLinkedin /></a>
            <a href="#" className="social-grid__node" aria-label="YouTube"><FaYoutube /></a>
            <a href="#" className="social-grid__node" aria-label="TikTok"><FaTiktok /></a>
            <a href="#" className="social-grid__node" aria-label="GitHub"><FaGithub /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="app-bottom__links">
          <div className="link-group">
            <h4 className="link-group__head">Platform</h4>
            <a href="#" className="link-group__item">About Us</a>
            <a href="#" className="link-group__item">How It Works</a>
            <a href="#" className="link-group__item">Careers</a>
            <a href="#" className="link-group__item">Press & News</a>
            <a href="#" className="link-group__item">Blog</a>
            <a href="#" className="link-group__item">Partners</a>
          </div>
          
          <div className="link-group">
            <h4 className="link-group__head">Support</h4>
            <a href="#" className="link-group__item">Help Center</a>
            <a href="#" className="link-group__item">Contact Us</a>
            <a href="#" className="link-group__item">FAQs</a>
            <a href="#" className="link-group__item">Privacy Policy</a>
            <a href="#" className="link-group__item">Terms of Service</a>
            <a href="#" className="link-group__item">Cookie Settings</a>
          </div>

          <div className="link-group">
            <h4 className="link-group__head">Events</h4>
            <a href="#" className="link-group__item">Concerts</a>
            <a href="#" className="link-group__item">Conferences</a>
            <a href="#" className="link-group__item">Workshops</a>
            <a href="#" className="link-group__item">Festivals</a>
            <a href="#" className="link-group__item">Sports</a>
            <a href="#" className="link-group__item">Virtual Events</a>
          </div>

          <div className="link-group">
            <h4 className="link-group__head">Resources</h4>
            <a href="#" className="link-group__item">Community</a>
            <a href="#" className="link-group__item">Developers</a>
            <a href="#" className="link-group__item">API Docs</a>
            <a href="#" className="link-group__item">Mobile App</a>
            <a href="#" className="link-group__item">Gift Cards</a>
            <a href="#" className="link-group__item">Refer a Friend</a>
          </div>
        </div>

        {/* Contact & Newsletter Section */}
        <div className="app-bottom__contact">
          <div className="contact-info">
            <h4 className="contact-info__title">Get in Touch</h4>
            <div className="contact-info__item">
              <FaEnvelope className="contact-info__icon" />
              <span>hello@eventpro.com</span>
            </div>
            <div className="contact-info__item">
              <FaPhone className="contact-info__icon" />
              <span>+1 (800) 123-4567</span>
            </div>
            <div className="contact-info__item">
              <FaMapMarkerAlt className="contact-info__icon" />
              <span>123 Event Street, New York, NY 10001</span>
            </div>
            <div className="contact-info__item">
              <FaClock className="contact-info__icon" />
              <span>Mon-Fri: 9AM - 6PM EST</span>
            </div>
          </div>

          <div className="newsletter">
            <h4 className="newsletter__title">Subscribe to Our Newsletter</h4>
            <p className="newsletter__text">Get the latest updates on events and exclusive offers!</p>
            <form className="newsletter__form">
              <input 
                type="email" 
                className="newsletter__input" 
                placeholder="Enter your email address"
                aria-label="Email for newsletter"
              />
              <button type="submit" className="newsletter__button">Subscribe</button>
            </form>
            <p className="newsletter__note">By subscribing, you agree to our Privacy Policy.</p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="app-bottom__trust">
        <div className="trust-badge">
          <span className="trust-badge__icon">🔒</span>
          <span>Secure Payments</span>
        </div>
        <div className="trust-badge">
          <span className="trust-badge__icon">⭐</span>
          <span>10K+ Happy Customers</span>
        </div>
        <div className="trust-badge">
          <span className="trust-badge__icon">🌍</span>
          <span>50+ Countries</span>
        </div>
        <div className="trust-badge">
          <span className="trust-badge__icon">🎫</span>
          <span>1M+ Tickets Sold</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="app-bottom__payments">
        <span className="payments__label">Payment Methods:</span>
        <div className="payments__icons">
          <span className="payments__icon">💳 Visa</span>
          <span className="payments__icon">💳 Mastercard</span>
          <span className="payments__icon">💳 Amex</span>
          <span className="payments__icon">📱 PayPal</span>
          <span className="payments__icon">📱 Apple Pay</span>
          <span className="payments__icon">📱 Google Pay</span>
        </div>
      </div>
      
      {/* Legal Bottom */}
      <div className="app-bottom__legal">
        <p className="app-bottom__copyright">
          &copy; {year} EventPro. All rights reserved. | 
          <a href="#" className="app-bottom__legal-link">Privacy</a> | 
          <a href="#" className="app-bottom__legal-link">Terms</a> | 
          <a href="#" className="app-bottom__legal-link">Accessibility</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;