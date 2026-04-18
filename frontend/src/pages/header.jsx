import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiHome, FiCalendar, FiLogOut, FiMenu, FiX, 
  FiTable, FiUser, FiShoppingCart, FiBell, FiSettings, 
  FiBook, FiCheckCircle, FiPackage, FiBarChart2, 
  FiSearch, FiMessageSquare, FiHelpCircle
} from 'react-icons/fi';
import './Header.css';
import { getUserRole } from '../utils/auth';
import ThemeToggle from '../components/ThemeToggle';
import { logoutUser } from '../store/slices/authSlice';
import { CartButton } from '../components/CartDrawer';
import NotificationBell from '../components/NotificationBell';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [role, setRole] = useState('booker');
  const [isScrolled, setIsScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) setMobileMenuOpen(false);
    if (profileMenuOpen) setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/discover', icon: <FiCalendar />, label: 'Events' },
    { path: '/my-tickets', icon: <FiTable />, label: 'Tickets' },
  ];

  if (role === 'admin' || role === 'organiser') {
    navItems.push({ path: '/admin-tickets', icon: <FiBook />, label: 'All Tickets' });
    navItems.push({ path: '/organizer', icon: <FiUser />, label: 'Organizer' });
  }
  if (role === 'admin') {
    navItems.push({ path: '/admin-events', icon: <FiCheckCircle />, label: 'Approvals' });
  }

  const isAdminOrOrganizer = role === 'admin' || role === 'organiser';

  // Profile dropdown menu items
  const profileMenuItems = [
    { path: '/profile',       icon: <FiUser />,        label: 'Profile' },
    { path: '/settings',      icon: <FiSettings />,    label: 'Settings' },
    { path: '/order-history', icon: <FiPackage />,     label: 'Order History' },
    ...(isAdminOrOrganizer ? [{ path: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' }] : []),
    // { path: '/search',        icon: <FiSearch />,      label: 'Search' },
    { path: '/calendar',      icon: <FiCalendar />,    label: 'Calendar' },
    { path: '/messages',      icon: <FiMessageSquare />, label: 'Messages' },
    { path: '/help',          icon: <FiHelpCircle />,  label: 'Help & Support' },
  ];

  const handleLogout = async () => {
    await dispatch(logoutUser());
    localStorage.removeItem('authProvider');
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    navigate('/', { replace: true });
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  };

  const getAvatarUrl = (user) => {
    if (!user) return null;
    if (user.avatar) {
      return user.avatar.startsWith('http') 
        ? user.avatar 
        : `${import.meta.env.VITE_BASE_URL}${user.avatar}`;
    }
    return null;
  };

  const userAvatar = user ? getAvatarUrl(user) : null;
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&bold=true`;

  return (
    <>
      <header 
        className={`dashboard-header ${isScrolled ? 'scrolled' : ''}`}
        role="banner"
      >
        <div className="header-content">
          {/* Logo */}
          <div 
            className="app-title-container" 
            onClick={() => handleNavigation(isAuthenticated ? '/dashboard' : '/')}
            role="button"
            tabIndex={0}
          >
            <h1 className="app-title">EventPro</h1>
            <div className="app-badge">EP</div>
          </div>

          {isAuthenticated ? (
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

                <div className="user-controls desktop-controls">
                  <ThemeToggle />
                  <div className="notification-bell-trigger">
                    <NotificationBell />
                  </div>
                  <div className="cart-button-trigger">
                    <CartButton />
                  </div>

                  {/* Profile Avatar with Dropdown */}
                  <div className="profile-menu-wrapper" ref={profileRef}>
                    <button 
                      className={`user-avatar-l ${profileMenuOpen ? 'active' : ''}`}
                      onClick={() => setProfileMenuOpen((prev) => !prev)}
                      aria-label="Open profile menu"
                      aria-expanded={profileMenuOpen}
                    >
                     {userAvatar ? (
  <img
    src={userAvatar.startsWith('http') 
      ? userAvatar 
      : `${import.meta.env.VITE_API_URL}/${userAvatar}`
    }
    alt={user?.name}
    className="avatar-img"
    onError={(e) => {
      e.target.style.display = "none";
    }}
  />
) : null}

<span className="avatar-fallback">
  {user?.name?.charAt(0) || "👤"}
</span>
                    </button>

                    {profileMenuOpen && (
                      <div className="profile-dropdown">
                        {/* User info header */}
                        <div className="profile-dropdown-header">
                          <div className="profile-dropdown-avatar">
                            {userAvatar ? (
                              <img src={userAvatar} alt={user?.name} className="avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            ) : null}
                            <span className="avatar-fallback" style={userAvatar ? { display: 'none' } : {}}>{user?.name?.charAt(0) || '👤'}</span>
                          </div>
                          <div className="profile-dropdown-info">
                            <span className="profile-dropdown-name">{user?.name || 'User'}</span>
                            <span className="profile-dropdown-email">{user?.email || ''}</span>
                          </div>
                        </div>

                        {/* Menu items */}
                        <ul className="profile-dropdown-list-k">
                          {profileMenuItems.map((item) => (
                            <li key={item.path}>
                              <button
                                className={`profile-dropdown-item ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => handleNavigation(item.path)}
                              >
                                {item.icon}
                                <span>{item.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>

                        {/* Logout */}
                        <div className="profile-dropdown-footer">
                          <button className="profile-dropdown-logout" onClick={handleLogout}>
                            <FiLogOut />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="mobile-menu-toggle"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  tabIndex={0}
                  type="button"
                >
                  {mobileMenuOpen ? "X" : "≡"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="guest-actions">
                <ThemeToggle />
                <button onClick={() => navigate('/login')}>Login</button>
                <button onClick={() => navigate('/register')}>Register</button>
              </div>
              <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                tabIndex={0}
                type="button"
                style={{ display: 'flex' }}
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div 
          className="mobile-menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-menu-header-k">
            <div className="mobile-user-info" onClick={() => handleNavigation('/profile')}>
              <div className="mobile-user-avatar">
                {userAvatar ? (
                  <img src={userAvatar} alt={user?.name} className="avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                ) : null}
                <span className="avatar-fallback" style={userAvatar ? { display: 'none' } : {}}>{user?.name?.charAt(0) || '👤'}</span>
              </div>
              <div className="mobile-user-details">
                <h3>{user?.name || 'User'}</h3>
                <p>{user?.email || ''}</p>
              </div>
            </div>
          </div>

          <nav className="mobile-nav-k">
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

            {/* Profile sub-items in mobile menu */}
            <div className="mobile-menu-divider"></div>
            {profileMenuItems.map((item) => (
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

          <div className="mobile-menu-divider"></div>

          <div className="mobile-menu-controls">
            <div className="mobile-controls-wrapper">
              <ThemeToggle />
              <NotificationBell />
              <CartButton />
            </div>
            <button 
              className="mobile-logout-btn"
              onClick={handleLogout}
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;