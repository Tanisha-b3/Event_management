import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSun, FiMoon, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Themetoggle.css';
import { selectThemeMode, toggleTheme as toggleThemeAction } from '../store/slices/themeSlice';

const ThemeToggle = ({ showSettings = false, onSettingsClick }) => {
  const dispatch = useDispatch();
  const reduxMode = useSelector(selectThemeMode);
  
  // Get theme from Redux
  const isDark = reduxMode === 'dark';

  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Apply theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.body.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc';
    document.documentElement.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc';
  }, []);

  // Apply theme when Redux changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Force body background update
    document.body.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc';
    document.documentElement.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc';
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        const isDark = e.matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.body.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc';
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggleTheme = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Dispatch Redux action to toggle theme
    dispatch(toggleThemeAction());
    
    // Add haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    setTimeout(() => setIsAnimating(false), 500);
  };
  
  // Get current theme icon
  const getIcon = () => {
    if (isDark) return <FiMoon className="theme-icon" />;
    return <FiSun className="theme-icon" />;
  };
  
  // Get tooltip text
  const getTooltipText = () => {
    return isDark ? 'Switch to light mode' : 'Switch to dark mode';
  };
  
  return (
    <div className="theme-toggle-wrapper">
      <motion.button
        className={`theme-toggle ${isDark ? 'dark' : 'light'} ${isAnimating ? 'animating' : ''}`}
        onClick={handleToggleTheme}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={getTooltipText()}
        title={getTooltipText()}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          rotate: isHovered ? (isDark ? -10 : 10) : 0,
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <span className="theme-toggle-track">
          <motion.span 
            className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`}
            initial={false}
            animate={{
              x: isDark ? 0 : 28,
              rotate: isDark ? 0 : 180
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
          >
            <motion.span
              animate={{
                rotate: isDark ? 0 : 360,
                scale: isAnimating ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.3 }}
            >
              {getIcon()}
            </motion.span>
          </motion.span>
        </span>
        
        {/* Ripple effect */}
        <AnimatePresence>
          {isAnimating && (
            <motion.span
              className="theme-toggle-ripple"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </motion.button>
      
      {/* Settings button (optional) */}
      {showSettings && (
        <motion.button
          className="theme-settings-btn"
          onClick={onSettingsClick}
          aria-label="Theme settings"
          title="Theme settings"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiSettings />
        </motion.button>
      )}
      
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="theme-tooltip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {getTooltipText()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;