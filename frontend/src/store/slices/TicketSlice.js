import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth header
const getAuthConfig = (getState) => {
  const token = getState().auth.token;
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

// Async Thunks for Tickets

// Get all tickets for authenticated user (non-cancelled, paginated)
export const fetchUserTickets = createAsyncThunk(
  'tickets/fetchUserTickets',
  async ({ page = 1, limit = 12 } = {}, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/tickets?page=${page}&limit=${limit}`,
        getAuthConfig(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tickets');
    }
  }
);

// Create a new ticket (book ticket)
export const bookTicket = createAsyncThunk(
  'tickets/bookTicket',
  async (ticketData, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/tickets`,
        ticketData,
        getAuthConfig(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to book ticket');
    }
  }
);

// Cancel (soft delete) a ticket (user cancels their own ticket)
export const cancelTicket = createAsyncThunk(
  'tickets/cancelTicket',
  async (ticketId, { getState, rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_URL}/tickets/${ticketId}`,
        getAuthConfig(getState)
      );
      return { ticketId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel ticket');
    }
  }
);

// Admin: Get all tickets (for any event)
export const fetchAllTicketsAdmin = createAsyncThunk(
  'tickets/fetchAllTicketsAdmin',
  async ({ page = 1, limit = 20, eventId = null } = {}, { getState, rejectWithValue }) => {
    try {
      let url = `${API_URL}/tickets/admin/all?page=${page}&limit=${limit}`;
      if (eventId) {
        url += `&eventId=${eventId}`;
      }
      const response = await axios.get(url, getAuthConfig(getState));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tickets');
    }
  }
);

// Admin/Organiser: Get tickets for a specific event
export const fetchEventTickets = createAsyncThunk(
  'tickets/fetchEventTickets',
  async ({ eventId, page = 1, limit = 20 }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/tickets/event/${eventId}?page=${page}&limit=${limit}`,
        getAuthConfig(getState)
      );
      return { eventId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch event tickets');
    }
  }
);

// Admin/Organiser: Book ticket on behalf of user
export const adminBookTicket = createAsyncThunk(
  'tickets/adminBookTicket',
  async (ticketData, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/tickets/admin/book`,
        ticketData,
        getAuthConfig(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to book ticket as admin');
    }
  }
);

// Admin/Organiser: Cancel any ticket (with reason)
export const adminCancelTicket = createAsyncThunk(
  'tickets/adminCancelTicket',
  async ({ ticketId, reason }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_URL}/tickets/admin/${ticketId}`,
        {
          ...getAuthConfig(getState),
          data: { reason }
        }
      );
      return { ticketId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel ticket');
    }
  }
);

// Initial state
const initialState = {
  tickets: [],           // Current tickets view
  userTickets: [],      // User's own tickets
  allTickets: [],       // Admin view of all tickets
  eventTickets: {},     // Object mapping eventId to tickets
  currentTicket: null,
  cart: [],
  cartTotal: 0,
  cartItemCount: 0,
  loading: false,
  error: null,
  bookingStatus: 'idle',
  cancellationStatus: 'idle',
  adminBookingStatus: 'idle',
  adminCancellationStatus: 'idle',
  lastBooking: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  },
  adminPagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

// Ticket Slice
const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearTicketError: (state) => {
      state.error = null;
    },
    resetBookingStatus: (state) => {
      state.bookingStatus = 'idle';
      state.adminBookingStatus = 'idle';
      state.lastBooking = null;
    },
    resetCancellationStatus: (state) => {
      state.cancellationStatus = 'idle';
      state.adminCancellationStatus = 'idle';
    },
    clearUserTickets: (state) => {
      state.userTickets = [];
      state.tickets = [];
    },
    clearAllTickets: (state) => {
      state.allTickets = [];
      state.eventTickets = {};
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload;
    },
    
    // Cart reducers
    addToCart: (state, action) => {
      const existingItemIndex = state.cart.findIndex(
        item => item.eventId === action.payload.eventId && 
                item.ticketType === action.payload.ticketType
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item
        state.cart[existingItemIndex].quantity += action.payload.quantity;
      } else {
        // Add new item
        state.cart.push({
          ...action.payload,
          id: `${action.payload.eventId}-${action.payload.ticketType}-${Date.now()}-${Math.random()}`
        });
      }
      
      // Recalculate totals
      state.cartTotal = state.cart.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      state.cartItemCount = state.cart.reduce(
        (sum, item) => sum + item.quantity, 0
      );
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(state.cart));
    },
    
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter(item => item.id !== action.payload);
      state.cartTotal = state.cart.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      state.cartItemCount = state.cart.reduce(
        (sum, item) => sum + item.quantity, 0
      );
      localStorage.setItem('cart', JSON.stringify(state.cart));
    },
    
    updateCartQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cart.find(item => item.id === id);
      if (item && quantity > 0) {
        item.quantity = quantity;
        state.cartTotal = state.cart.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        );
        state.cartItemCount = state.cart.reduce(
          (sum, item) => sum + item.quantity, 0
        );
        localStorage.setItem('cart', JSON.stringify(state.cart));
      } else if (item && quantity <= 0) {
        // Remove item if quantity is 0 or negative
        state.cart = state.cart.filter(item => item.id !== id);
        state.cartTotal = state.cart.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        );
        state.cartItemCount = state.cart.reduce(
          (sum, item) => sum + item.quantity, 0
        );
        localStorage.setItem('cart', JSON.stringify(state.cart));
      }
    },
    
    clearCart: (state) => {
      state.cart = [];
      state.cartTotal = 0;
      state.cartItemCount = 0;
      localStorage.removeItem('cart');
    },
    
    clearSpecificCartItems: (state, action) => {
      const itemIdsToRemove = action.payload;
      state.cart = state.cart.filter(item => !itemIdsToRemove.includes(item.id));
      state.cartTotal = state.cart.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      state.cartItemCount = state.cart.reduce(
        (sum, item) => sum + item.quantity, 0
      );
      localStorage.setItem('cart', JSON.stringify(state.cart));
    },
    
    loadCartFromStorage: (state) => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          state.cart = JSON.parse(savedCart);
          state.cartTotal = state.cart.reduce(
            (sum, item) => sum + (item.price * item.quantity), 0
          );
          state.cartItemCount = state.cart.reduce(
            (sum, item) => sum + item.quantity, 0
          );
        } catch (error) {
          console.error('Error loading cart from storage:', error);
          localStorage.removeItem('cart');
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Tickets
      .addCase(fetchUserTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.userTickets = action.payload.tickets || [];
        state.tickets = action.payload.tickets || [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0
        };
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch All Tickets Admin
      .addCase(fetchAllTicketsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTicketsAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.allTickets = action.payload.tickets || [];
        state.adminPagination = action.payload.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        };
      })
      .addCase(fetchAllTicketsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Event Tickets
      .addCase(fetchEventTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.eventTickets[action.payload.eventId] = {
          tickets: action.payload.data.tickets || [],
          pagination: action.payload.data.pagination
        };
      })
      .addCase(fetchEventTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Book Ticket (User)
      .addCase(bookTicket.pending, (state) => {
        state.bookingStatus = 'loading';
        state.error = null;
      })
      .addCase(bookTicket.fulfilled, (state, action) => {
        state.bookingStatus = 'succeeded';
        state.lastBooking = action.payload;
        if (action.payload.ticket) {
          state.userTickets.unshift(action.payload.ticket);
          state.tickets.unshift(action.payload.ticket);
        }
      })
      .addCase(bookTicket.rejected, (state, action) => {
        state.bookingStatus = 'failed';
        state.error = action.payload;
      })
      
      // Admin Book Ticket
      .addCase(adminBookTicket.pending, (state) => {
        state.adminBookingStatus = 'loading';
        state.error = null;
      })
      .addCase(adminBookTicket.fulfilled, (state, action) => {
        state.adminBookingStatus = 'succeeded';
        state.lastBooking = action.payload;
        if (action.payload.ticket) {
          state.allTickets.unshift(action.payload.ticket);
          // Also add to event tickets if exists
          const eventId = action.payload.ticket.eventId;
          if (state.eventTickets[eventId]) {
            state.eventTickets[eventId].tickets.unshift(action.payload.ticket);
          }
        }
      })
      .addCase(adminBookTicket.rejected, (state, action) => {
        state.adminBookingStatus = 'failed';
        state.error = action.payload;
      })
      
      // Cancel Ticket (User)
      .addCase(cancelTicket.pending, (state) => {
        state.cancellationStatus = 'loading';
      })
      .addCase(cancelTicket.fulfilled, (state, action) => {
        state.cancellationStatus = 'succeeded';
        state.userTickets = state.userTickets.filter(
          ticket => ticket._id !== action.payload.ticketId
        );
        state.tickets = state.tickets.filter(
          ticket => ticket._id !== action.payload.ticketId
        );
      })
      .addCase(cancelTicket.rejected, (state, action) => {
        state.cancellationStatus = 'failed';
        state.error = action.payload;
      })
      
      // Admin Cancel Ticket
      .addCase(adminCancelTicket.pending, (state) => {
        state.adminCancellationStatus = 'loading';
      })
      .addCase(adminCancelTicket.fulfilled, (state, action) => {
        state.adminCancellationStatus = 'succeeded';
        // Remove from allTickets
        state.allTickets = state.allTickets.filter(
          ticket => ticket._id !== action.payload.ticketId
        );
        // Remove from userTickets if present
        state.userTickets = state.userTickets.filter(
          ticket => ticket._id !== action.payload.ticketId
        );
        // Remove from eventTickets
        Object.keys(state.eventTickets).forEach(eventId => {
          state.eventTickets[eventId].tickets = state.eventTickets[eventId].tickets.filter(
            ticket => ticket._id !== action.payload.ticketId
          );
        });
      })
      .addCase(adminCancelTicket.rejected, (state, action) => {
        state.adminCancellationStatus = 'failed';
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  clearTicketError,
  resetBookingStatus,
  resetCancellationStatus,
  clearUserTickets,
  clearAllTickets,
  setCurrentTicket,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  clearSpecificCartItems,
  loadCartFromStorage,
} = ticketSlice.actions;

// Selectors
export const selectUserTickets = (state) => state.tickets.userTickets;
export const selectAllTickets = (state) => state.tickets.allTickets;
export const selectEventTickets = (state, eventId) => state.tickets.eventTickets[eventId];
export const selectCurrentTicket = (state) => state.tickets.currentTicket;
export const selectCartItems = (state) => state.tickets.cart;
export const selectCartTotal = (state) => state.tickets.cartTotal;
export const selectCartItemCount = (state) => state.tickets.cartItemCount;
export const selectBookingStatus = (state) => state.tickets.bookingStatus;
export const selectAdminBookingStatus = (state) => state.tickets.adminBookingStatus;
export const selectCancellationStatus = (state) => state.tickets.cancellationStatus;
export const selectAdminCancellationStatus = (state) => state.tickets.adminCancellationStatus;
export const selectLastBooking = (state) => state.tickets.lastBooking;
export const selectTicketError = (state) => state.tickets.error;
export const selectTicketPagination = (state) => state.tickets.pagination;
export const selectAdminPagination = (state) => state.tickets.adminPagination;
export const selectTicketsLoading = (state) => state.tickets.loading;

export default ticketSlice.reducer;