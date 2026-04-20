import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth?.token;
      
      console.log('[fetchNotifications] Token:', token ? 'present' : 'missing');
      
      if (!token) {
        console.log('[fetchNotifications] No token, returning empty notifications');
        return [];
      }
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('[fetchNotifications] Response:', response.data);
      let notifications = [];
      if (Array.isArray(response.data)) {
        notifications = response.data;
      } else if (response.data && Array.isArray(response.data.notifications)) {
        notifications = response.data.notifications;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        notifications = response.data.data;
      } else {
        notifications = [];
      }
      
      // console.log('Fetched notifications count:', notifications.length);
      return notifications;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Notifications endpoint not available');
        return [];
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      const response = await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('markAsRead error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (error) {
      console.error('markAllAsRead error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return notificationId;
    } catch (error) {
      console.error('deleteNotification error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

// Mock notifications for development (remove this in production)
const getMockNotifications = () => {
  return [
    {
      _id: '1',
      title: 'Welcome to EventPro!',
      message: 'Start exploring events and book your tickets',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      _id: '2',
      title: 'New Event Available',
      message: 'Check out our latest events in your area',
      type: 'event',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: '3',
      title: 'Ticket Booking Tip',
      message: 'Book early to get the best seats!',
      type: 'ticket',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
addNotification: (state, action) => {
      const notification = action.payload;
      if (!notification || !notification._id) return;

      // Check if notification already exists to prevent duplicates
      const exists = state.notifications.some((n) => n && n._id === notification._id);
      if (exists) return;

      state.notifications.unshift(notification);
      if (!notification.read) {
        state.unreadCount += 1;
      }
    },
    // Socket-based read update (synchronous)
    markNotificationRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find((n) => n && n._id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    // Socket-based mark all read (synchronous)
    markAllNotificationsRead: (state) => {
      state.notifications.forEach((n) => {
        if (n) n.read = true;
      });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
    // For development - add mock notifications
    addMockNotifications: (state) => {
      const mockNotifs = getMockNotifications();
      state.notifications = mockNotifs;
      state.unreadCount = mockNotifs.filter(n => !n.read).length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        // Replace notifications completely instead of merging
        state.notifications = action.payload || [];
        state.unreadCount = (action.payload || []).filter((n) => n && !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Set empty array on error
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        // Backend returns the updated notification object
        const updatedNotif = action.payload;
        const notification = state.notifications.find((n) => n && (n._id === updatedNotif?._id || n._id === updatedNotif));
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        console.error('Failed to mark as read:', action.payload);
        state.error = action.payload;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          if (n) n.read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        console.error('Failed to mark all as read:', action.payload);
        state.error = action.payload;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n && n._id === action.payload);
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter((n) => n && n._id !== action.payload);
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        console.error('Failed to delete notification:', action.payload);
        state.error = action.payload;
      });
  },
});

export const { addNotification, markNotificationRead, markAllNotificationsRead, clearNotifications, clearError, addMockNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
