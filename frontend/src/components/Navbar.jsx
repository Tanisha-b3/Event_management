import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  Person,
  DarkMode,
  LightMode,
  ConfirmationNumber,
  Analytics,
  CalendarMonth,
  Help,
  Email,
  History,
  Search,
} from '@mui/icons-material';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';

const Navbar = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const { items } = useSelector((state) => state.cart);
  const { mode } = useSelector((state) => state.theme);
  
  const cartItemCount = items.reduce((count, item) => count + item.quantity, 0);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationAnchor, setNotificationAnchor] = React.useState(null);

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNotificationOpen = (event) => setNotificationAnchor(event.currentTarget);
  const handleNotificationClose = () => setNotificationAnchor(null);

  const handleLogout = () => {
    dispatch(logoutUser());
    handleMenuClose();
    navigate('/login');
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: mode === 'dark' ? '#1e1e1e' : '#6366f1' }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component={Link}
          to="/dashboard"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
        >
          EventHub
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={handleThemeToggle}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>

          {isAuthenticated && (
            <>
              <IconButton color="inherit" component={Link} to="/cart">
                <Badge badgeContent={cartItemCount} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>

              <IconButton color="inherit" onClick={handleNotificationOpen}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              <IconButton onClick={handleProfileMenuOpen} color="inherit">
                {user?.avatar ? (
                  <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </>
          )}
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.name || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem onClick={() => { navigate('/order-history'); handleMenuClose(); }}>
            <ListItemIcon><History fontSize="small" /></ListItemIcon>
            Order History
          </MenuItem>
          <MenuItem onClick={() => { navigate('/search'); handleMenuClose(); }}>
            <ListItemIcon><Search fontSize="small" /></ListItemIcon>
            Search Events
          </MenuItem>
          <MenuItem onClick={() => { navigate('/calendar'); handleMenuClose(); }}>
            <ListItemIcon><CalendarMonth fontSize="small" /></ListItemIcon>
            Calendar
          </MenuItem>
          {user?.role === 'organiser' || user?.role === 'admin' ? (
            <MenuItem onClick={() => { navigate('/analytics'); handleMenuClose(); }}>
              <ListItemIcon><Analytics fontSize="small" /></ListItemIcon>
              Analytics
            </MenuItem>
          ) : null}
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
        >
          <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
            <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
              Mark all as read
            </Typography>
          </Box>
          <Divider />
          {unreadCount === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            </MenuItem>
          ) : (
            <MenuItem onClick={handleNotificationClose}>
              <Typography variant="body2">
                You have {unreadCount} unread notifications
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
