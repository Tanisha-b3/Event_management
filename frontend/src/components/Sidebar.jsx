import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  Event,
  Explore,
  Add,
  ConfirmationNumber,
  Person,
  Settings,
  Message,
  Analytics,
  CalendarMonth,
  Search,
  History,
  Help,
} from '@mui/icons-material';

const organizerItems = [
  { text: 'Create Event', icon: <Add />, path: '/create-event' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
];

const Sidebar = ({ open, onClose, variant = 'temporary' }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Discover Events', icon: <Explore />, path: '/discover' },
    { text: 'Search Events', icon: <Search />, path: '/search' },
    { text: 'Calendar View', icon: <CalendarMonth />, path: '/calendar' },
    { text: 'My Tickets', icon: <ConfirmationNumber />, path: '/my-tickets' },
    { text: 'Order History', icon: <History />, path: '/order-history' },
    { text: 'Messages', icon: <Message />, path: '/messages' },
    { text: 'Help & Support', icon: <Help />, path: '/help' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const drawerWidth = 260;

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Info */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
        }}
      >
        <Avatar
          src={user?.avatar}
          sx={{ width: 48, height: 48, bgcolor: '#6366f1' }}
        >
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {user?.name || 'Guest'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role || 'User'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.active': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  '& .MuiListItemIcon-root': {
                    color: '#6366f1',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Organizer-only items */}
        {(user?.role === 'organiser' || user?.role === 'admin') && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
              Organizer
            </Typography>
            {organizerItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    '&.active': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          EventHub © 2024
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
