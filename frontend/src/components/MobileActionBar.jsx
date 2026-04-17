import React from 'react';
import {
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  FilterList,
  Person,
  Search,
  ShoppingCart,
  Home,
  Explore,
  CalendarMonth,
  ConfirmationNumber,
  Message,
  Settings,
} from '@mui/icons-material';

const MobileActionBar = ({
  value = 'home',
  onChange,
  onSearch,
  onFilter,
  onCart,
  onProfile,
  onHome,
  cartCount = 0,
  filterActive = false,
  elevation = 0,
}) => {
  const handleChange = (_event, newValue) => {
    onChange && onChange(newValue);
    if (newValue === 'search') onSearch && onSearch();
    if (newValue === 'filter') onFilter && onFilter();
    if (newValue === 'cart') onCart && onCart();
    if (newValue === 'profile') onProfile && onProfile();
    if (newValue === 'home') onHome && onHome();
  };

  return (
    <Paper
      elevation={elevation}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 90,
        display: { xs: 'block', md: 'none' },
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          pt: 0.5,
          px: 0.5,
          background: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '8px 12px',
            color: '#64748b',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              color: '#6366f1',
            },
            '&:hover': {
              background: 'rgba(99,102,241,0.08)',
              borderRadius: 12,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.65rem',
            fontWeight: 600,
            '&.Mui-selected': {
              fontWeight: 700,
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          value="home"
          icon={<Home />}
        />
        <BottomNavigationAction
          label="Discover"
          value="discover"
          icon={<Explore />}
        />
        <BottomNavigationAction
          label="Tickets"
          value="tickets"
          icon={<ConfirmationNumber />}
        />
        <BottomNavigationAction
          label="Calendar"
          value="calendar"
          icon={<CalendarMonth />}
        />
        <BottomNavigationAction
          label="More"
          value="more"
          icon={<MoreHoriz />}
        />
      </BottomNavigation>
    </Paper>
  );
};

function MoreHoriz() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export default MobileActionBar;