import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, FiCalendar, FiLogOut, FiMenu, FiX, 
  FiTable, FiUser
} from 'react-icons/fi';
import './Header.css';
import "../components/Dashboard.css";
import { getUserRole } from '../utils/auth';
// import { X } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('booker');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const authProvider = localStorage.getItem('authProvider');
    setIsLoggedIn(!!token || !!authProvider);
    setRole(getUserRole());
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/discover', icon: <FiCalendar />, label: 'Events' },
    { path: '/my-tickets', icon: <FiTable />, label: 'Tickets' },
  ];

  if (role === 'admin' || role === 'organiser') {
    navItems.push({ path: '/organizer', icon: <FiUser />, label: 'Organizer' });
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authProvider');
    setIsLoggedIn(false);
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div 
          className="app-title-container" 
          onClick={() => handleNavigation(isLoggedIn ? '/dashboard' : '/')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigation(isLoggedIn ? '/dashboard' : '/')}
        >
          <h1 className="app-title">EventPro</h1>
        </div>

        {isLoggedIn ? (
          <>
            <div className="header-actions">
              <nav className="header-nav">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="user-controls">
                <button 
                  className="user-avatar"
                  onClick={() => handleNavigation('/profile')}
                  aria-label="User profile"
                >
                  👤
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>

              <button 
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? "X" : "☰"}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="mobile-menu">
                <nav className="mobile-nav">
                  {navItems.map((item) => (
                    <button
                      key={item.path}
                      className={`mobile-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                <button 
                  className="mobile-logout-btn"
                  onClick={handleLogout}
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="guest-actions">
            <button onClick={() => navigate('/login')}>Login</button>
            <button onClick={() => navigate('/register')}>Register</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;