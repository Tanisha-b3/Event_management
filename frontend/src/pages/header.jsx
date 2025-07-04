import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, FiCalendar, FiUser, FiLogOut, FiMenu, FiX, 
  FiTable, FiSearch, FiMapPin 
} from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Header.css';

const Header = ({ onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [showSearchFilters, setShowSearchFilters] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const authProvider = localStorage.getItem('authProvider');
    setIsLoggedIn(!!token || !!authProvider);
    
    const searchParams = new URLSearchParams(location.search);
    setSearchTerm(searchParams.get('search') || '');
    setLocationTerm(searchParams.get('location') || '');
    
    if (searchParams.get('startDate') && searchParams.get('endDate')) {
      setDateRange([
        new Date(searchParams.get('startDate')),
        new Date(searchParams.get('endDate'))
      ]);
    }
  }, [location]);

  const navItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/discover', icon: <FiCalendar />, label: 'Events' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
    { path: '/my-tickets', icon: <FiTable />, label: 'Tickets' },
    {path:'/create-event',icon:<FiMenu />, label:'CreateEvent'}
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (onSearch) {
      onSearch({
        searchTerm,
        locationTerm,
        startDate,
        endDate
      });
    } else {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (locationTerm) params.append('location', locationTerm);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      navigate(`/discover?${params.toString()}`);
    }
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setDateRange(dates);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setDateRange([null, null]);
    
    if (onSearch) {
      onSearch({
        searchTerm: '',
        locationTerm: '',
        startDate: null,
        endDate: null
      });
    } else {
      navigate('/discover');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authProvider');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="dashboard-header3">
      <div className="header-content2">
        <div 
          className="app-title-container" 
          onClick={() => handleNavigation(isLoggedIn ? '/dashboard' : '/')}
        >
          <h1 className="app-title">EventPro</h1>
        </div>

        {isLoggedIn && (
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
                  <FaUserCircle size={24} />
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
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
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

                <div className="mobile-filters">
                  <div className="mobile-filter-group">
                    <FiMapPin className="filter-icon" />
                    <input
                      type="text"
                      placeholder="Location..."
                      value={locationTerm}
                      onChange={(e) => setLocationTerm(e.target.value)}
                      className="filter-input"
                    />
                  </div>

                  <div className="mobile-date-filter">
                    <DatePicker
                      selectsRange={true}
                      startDate={startDate}
                      endDate={endDate}
                      onChange={handleDateChange}
                      isClearable={true}
                      placeholderText="Date range"
                      className="mobile-date-picker"
                    />
                  </div>

                  <div className="mobile-filter-actions">
                    <button 
                      className="apply-filters-button"
                      onClick={handleSearch}
                    >
                      Apply Filters
                    </button>
                    <button 
                      className="clear-filters-button"
                      onClick={clearFilters}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

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
        )}
      </div>
    </header>
  );
};

export default Header;