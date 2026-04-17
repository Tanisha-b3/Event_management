import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  CircularProgress,
  Snackbar,
  Alert,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Event,
  ConfirmationNumber,
  Message,
  Info,
  CheckCircle,
  Delete as DeleteIcon,
  ShoppingCart,
  Cancel,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../store/slices/notificationSlice';
// import socketService from '../utils/socketService';
import { toast } from 'react-toastify';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'event':
    case 'new_event':
    case 'event_update':
    case 'event_reminder':
      return <Event sx={{ color: '#3b82f6', fontSize: 24 }} />;
    case 'ticket':
    case 'ticket_booked':
      return <ConfirmationNumber sx={{ color: '#10b981', fontSize: 24 }} />;
    case 'ticket_cancelled':
    case 'event_cancelled':
      return <Cancel sx={{ color: '#ef4444', fontSize: 24 }} />;
    case 'cart_add':
    case 'cart_reminder':
      return <ShoppingCart sx={{ color: '#8b5cf6', fontSize: 24 }} />;
    case 'message':
      return <Message sx={{ color: '#06b6d4', fontSize: 24 }} />;
    case 'payment_success':
      return <CheckCircle sx={{ color: '#10b981', fontSize: 24 }} />;
    default:
      return <Info sx={{ color: '#94a3b8', fontSize: 24 }} />;
  }
};

const formatTime = (dateString) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );
  
  // Check auth from localStorage to ensure it's available
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [socketNotification, setSocketNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotificationId, setActionNotificationId] = useState(null);
  const open = Boolean(anchorEl);

  // Inject global styles for z-index, dark mode, and mobile sheet behavior
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Force notification dropdown to highest z-index */
      .notification-menu-paper {
        z-index: 999999 !important;
        position: fixed !important;
        top: 70px !important;
        right: 20px !important;
        left: auto !important;
        bottom: auto !important;
        max-width: 380px !important;
        width: 380px !important;
        border-radius: 16px !important;
        overflow: hidden !important;
        animation: notificationSlideIn 0.2s ease-out !important;
      }
      
      /* Dark mode styles for notification menu */
      [data-theme="dark"] .notification-menu-paper {
        background-color: #1f2937 !important;
        border: 1px solid #374151 !important;
        box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.5) !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiTypography-root {
        color: #f3f4f6 !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiTypography-colorTextSecondary,
      [data-theme="dark"] .notification-menu-paper .MuiTypography-caption {
        color: #9ca3af !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiListItem-root {
        border-color: #374151 !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiListItem-root:hover {
        background-color: rgba(99, 102, 241, 0.15) !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiBox-root[style*="border-bottom"] {
        border-color: #374151 !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiDivider-root {
        border-color: #374151 !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiIconButton-root {
        color: #9ca3af !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiIconButton-root:hover {
        background-color: rgba(239, 68, 68, 0.15) !important;
        color: #f87171 !important;
      }
      
      [data-theme="dark"] .notification-menu-paper .MuiMenuItem-root:hover {
        background-color: rgba(99, 102, 241, 0.15) !important;
      }
      
      @keyframes notificationSlideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes notificationSheetIn {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Mobile responsive */
      @media (max-width: 768px) {
        .notification-menu-paper {
          position: fixed !important;
          top: auto !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100vw !important;
          max-width: 100vw !important;
          border-radius: 18px 18px 0 0 !important;
          box-shadow: 0 -18px 36px rgba(0,0,0,0.28) !important;
          animation: notificationSheetIn 0.22s ease-out !important;
        }
      }
      
      /* Ensure notification bell is clickable */
      .notification-bell-wrapper {
        position: relative;
        z-index: 9999 !important;
      }
      
      /* Fix for MUI Menu portal */
      .MuiMenu-root {
        z-index: 999999 !important;
      }
      
      .MuiPopover-root {
        z-index: 999999 !important;
      }
      
      /* Backdrop style */
      .notification-backdrop {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 999998 !important;
        background: rgba(0, 0, 0, 0.3) !important;
        backdrop-filter: blur(2px) !important;
      }
      
      [data-theme="dark"] .notification-backdrop {
        background: rgba(0, 0, 0, 0.5) !important;
      }

      /* Delete button styling inside notification items */
      .delete-notification-btn {
        color: #9ca3af !important;
        opacity: 0.75;
        transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease;
        width: 32px;
        height: 32px;
      }

      .notification-menu-paper .MuiListItem-root:hover .delete-notification-btn {
        opacity: 1;
        transform: translateY(-50%) scale(1.05);
      }

      [data-theme="dark"] .delete-notification-btn {
        color: #9ca3af !important;
      }

      .delete-notification-btn.Mui-disabled {
        opacity: 0.5 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    // console.log('NotificationBell mounted, isAuthenticated:', isAuthenticated);
    // console.log('Token in localStorage:', !!localStorage.getItem('token'));
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated]);

  // Note: Socket notifications are handled globally in socketService.js
  // No need to duplicate the listener here

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification._id));
    }
    handleClose();

    if (notification.type === 'event' && notification.eventId) {
      window.location.href = `/event/${notification.eventId}`;
    } else if (notification.type === 'ticket' && notification.ticketId) {
      window.location.href = '/my-tickets';
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await dispatch(markAllAsRead()).unwrap();
      // toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error || 'Failed to mark all as read');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    setActionLoading(true);
    setActionNotificationId(notificationId);
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      // toast.success('Notification deleted');
    } catch (error) {
      toast.error(error || 'Failed to delete notification');
    } finally {
      setActionLoading(false);
      setActionNotificationId(null);
    }
  };

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const handleCloseSocketNotification = () => setSocketNotification(null);

  if (!isAuthenticated) return null;

  return (
    <div className="notification-bell-wrapper">
      <IconButton
        onClick={handleClick}
        size="large"
        sx={{
        color: isDark ? '#fff' : 'text.primary',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
          },
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '11px',
              height: '18px',
              minWidth: '18px',
              borderRadius: '9px',
            },
          }}
        >
        <NotificationsIcon sx={{ fontSize: 24, color: 'inherit' }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          className: 'notification-menu-paper',
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0 20px 35px -8px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
          },
        }}
        disableScrollLock={false}
      >
        {/* Header */}
<Box
  sx={{
    px: 2,
    py: 1.5,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',

    // 👇 ADD THIS
    '&[data-theme="dark"], [data-theme="dark"] &': {
      bgcolor: '#1f2937',
      borderColor: '#374151',
    },
  }}
>          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                },
              }}
            >
              {actionLoading && !actionNotificationId ? (
                <CircularProgress size={14} sx={{ mr: 0.5 }} />
              ) : (
                <CheckCircle sx={{ fontSize: 14, mr: 0.5 }} />
              )}
              Mark all read
            </Button>

          
          )}
            <Button onClick={handleClose} size="small" sx={{ textTransform: 'none', fontWeight: 1000, color: 'text.secondary' }}>X</Button>
        </Box>

        {/* Body */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : notifications?.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
              Notifications will appear here
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
            {notifications.slice(0, 15).map((notification) => (
              <ListItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  cursor: 'pointer',
                  py: 1.5,
                  px: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  backgroundColor: notification.read
                    ? 'transparent'
                    : 'rgba(99, 102, 241, 0.04)',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  position: 'relative',
                   pr: 5,
                   alignItems: 'flex-start',
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: 'transparent',
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: notification.read ? 400 : 600,
                        mb: 0.25,
                        color: 'text.primary',
                      }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          mb: 0.25,
                          fontSize: '0.7rem',
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'primary.main',
                          fontSize: '0.65rem',
                        }}
                      >
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
                <IconButton
                  aria-label="Delete notification"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification._id);
                  }}
                  disabled={actionLoading && actionNotificationId === notification._id}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    // transform: 'translateY(-50%)',
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      color: 'error.main',
                    },
                    '& .MuiCircularProgress-root': {
                      color: 'error.main',
                    },
                  }}
                  className="delete-notification-btn"
                >
                  {actionLoading && actionNotificationId === notification._id ? (
                    <CircularProgress size={14} thickness={6} />
                  ) : (
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}

        {/* Footer */}
        {notifications?.length > 15 && (
          <>
            <Divider />
            <MenuItem
              onClick={handleClose}
              sx={{
                justifyContent: 'center',
                py: 1.5,
                color: 'primary.main',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                },
              }}
            >
              View all notifications
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Real-time Snackbar Notification */}
      {/* <Snackbar
        open={!!socketNotification}
        autoHideDuration={5000}
        onClose={handleCloseSocketNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: 999999 }}
      > */}
        {/* <Alert
          onClose={handleCloseSocketNotification}
          severity="info"
          variant="filled"
          sx={{
            width: '100%',
            backgroundColor: '#6366f1',
            color: '#fff',
            '& .MuiAlert-icon': {
              color: '#fff',
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {socketNotification?.title}
          </Typography>
          <Typography variant="caption">
            {socketNotification?.message}
          </Typography>
        </Alert> */}
      {/* </Snackbar> */}
    </div>
  );
};

export default NotificationBell;
