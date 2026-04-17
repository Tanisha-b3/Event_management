import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
   <footer className="landing-footer">
           <div className="footer-content">
             <div className="footer-brand-k">
               <div className="footer-logo">
                 <span className="logo-icon">EP</span>
                 <span className="logo-text">EventPro</span>
               </div>
               <p>Your gateway to amazing events</p>
               <div className="footer-social">
                 <a href="#"><FaInstagram /></a>
                 <a href="#"><FaTwitter /></a>
                 <a href="#"><FaFacebook /></a>
                 <a href="#"><FaLinkedin /></a>
               </div>
             </div>
             <div className="footer-links">
               <div>
                 <h4>Platform</h4>
                 <a href="#">About</a>
                 <a href="#">Careers</a>
                 <a href="#">Press</a>
                 <a href="#">Blog</a>
               </div>
               <div>
                 <h4>Support</h4>
                 <a href="#">Help Center</a>
                 <a href="#">Contact</a>
                 <a href="#">Privacy</a>
                 <a href="#">Terms</a>
               </div>
             </div>
           </div>
           <div className="footer-bottom">
             <p>&copy; 2026 EventPro. All rights reserved.</p>
           </div>
         </footer>
  );
};

export default Footer;