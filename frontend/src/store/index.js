import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import eventReducer from './slices/eventSlice';
import notificationReducer from './slices/notificationSlice';
import cartReducer from './slices/cartSlice';
import themeReducer from './slices/themeSlice';
import uiReducer from './slices/uiSlice';
import ticketReducer from './slices/TicketSlice';
import favoritesReducer from './slices/favoritesSlice';
import ordersReducer from './slices/ordersSlice';
import analyticsReducer from './slices/analyticsSlice';
import messagesReducer from './slices/messagesSlice';
import discussionReducer from './slices/discussionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    notifications: notificationReducer,
    cart: cartReducer,
    theme: themeReducer,
    ui: uiReducer,
    tickets: ticketReducer,
    favorites: favoritesReducer,
    orders: ordersReducer,
    analytics: analyticsReducer,
    messages: messagesReducer,
    discussions: discussionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export default store;
