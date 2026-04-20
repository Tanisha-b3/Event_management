import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = (getState) => {
  const token = getState().auth.token;
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const params = new URLSearchParams();
      
      // Add all filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      const url = `${API_URL}/events${queryString ? `?${queryString}` : ''}`;
      
      // console.log('📡 Fetching events from:', url);
      
      const config = getAuthToken(getState);
      const response = await axios.get(url, config);
      
      // console.log('📥 Response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (eventId, { rejectWithValue, getState }) => {
    try {
      const config = getAuthToken(getState);
      const response = await axios.get(`${API_URL}/events/${eventId}`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch event');
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/create',
  async (eventData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_URL}/events`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ eventId, eventData }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`${API_URL}/events/${eventId}`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (eventId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`${API_URL}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return eventId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
    }
  }
);

export const generateEventDescription = createAsyncThunk(
  'events/generateDescription',
  async (eventData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_URL}/events/ai/describe`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate description');
    }
  }
);

export const searchEvents = createAsyncThunk(
  'events/search',
  async ({ q, limit = 12 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ q, limit });
      const response = await axios.get(`${API_URL}/events/search?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchMyEvents = createAsyncThunk(
  'events/fetchMyEvents',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } };
      }
      const response = await axios.get(`${API_URL}/events?myEvents=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your events');
    }
  }
);

export const fetchPendingEvents = createAsyncThunk(
  'events/fetchPending',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/events/pending`, {
        params: { page, limit },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending events');
    }
  }
);

export const fetchTrendingEvents = createAsyncThunk(
  'events/fetchTrending',
  async (_, { rejectWithValue }) => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/events/trending`;
      console.log("Fetching from:", url);

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Trending API error:", error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch trending events'
      );
    }
  }
);

export const fetchOrganizerDashboard = createAsyncThunk(
  'events/fetchDashboard',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/events/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
);

export const approveEvent = createAsyncThunk(
  'events/approve',
  async (eventId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(
        `${API_URL}/events/${eventId}/approve`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return { eventId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve event');
    }
  }
);

export const rejectEvent = createAsyncThunk(
  'events/reject',
  async ({ eventId, reason }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(
        `${API_URL}/events/${eventId}/reject`,
        { rejectionReason: reason },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return { eventId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject event');
    }
  }
);

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    myEvents: [],
    pendingEvents: [],
    trendingEvents: [],
    recommendations: [],
    searchResults: [],
    currentEvent: null,
    dashboard: null,
    loading: false,
    error: null,
    approvalLoading: false,
    filters: {
      category: '',
      date: '',
      location: '',
      search: '',
    },
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      pages: 1,
      hasNext: false,
      hasPrev: false
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { category: '', date: '', location: '', search: '' };
    },
    setCurrentEvent: (state, action) => {
      state.currentEvent = action.payload;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('❌ Redux: Events fetch failed', action.payload);
      })
      
      // Fetch Event By ID
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload.event;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        const newEvent = action.payload.data || action.payload.event;
        if (newEvent) {
          state.events.unshift(newEvent);
          state.myEvents.unshift(newEvent);
        }
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        const updatedEvent = action.payload.data || action.payload.event;
        if (updatedEvent) {
          const index = state.events.findIndex((e) => e._id === updatedEvent._id);
          if (index !== -1) state.events[index] = updatedEvent;
          
          const myIndex = state.myEvents.findIndex((e) => e._id === updatedEvent._id);
          if (myIndex !== -1) state.myEvents[myIndex] = updatedEvent;
          
          if (state.currentEvent?._id === updatedEvent._id) {
            state.currentEvent = updatedEvent;
          }
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Event
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.events = state.events.filter((e) => e._id !== deletedId);
        state.myEvents = state.myEvents.filter((e) => e._id !== deletedId);
        if (state.currentEvent?._id === deletedId) {
          state.currentEvent = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch My Events
      .addCase(fetchMyEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.myEvents = action.payload.events || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Pending Events
      .addCase(fetchPendingEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingEvents = action.payload.events || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchPendingEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Approve Event
      .addCase(approveEvent.pending, (state) => {
        state.approvalLoading = true;
      })
      .addCase(approveEvent.fulfilled, (state, action) => {
        state.approvalLoading = false;
        state.pendingEvents = state.pendingEvents.filter(e => e._id !== action.payload.eventId);
      })
      .addCase(approveEvent.rejected, (state, action) => {
        state.approvalLoading = false;
        state.error = action.payload;
      })
      
      // Reject Event
      .addCase(rejectEvent.pending, (state) => {
        state.approvalLoading = true;
      })
      .addCase(rejectEvent.fulfilled, (state, action) => {
        state.approvalLoading = false;
        state.pendingEvents = state.pendingEvents.filter(e => e._id !== action.payload.eventId);
      })
      .addCase(rejectEvent.rejected, (state, action) => {
        state.approvalLoading = false;
        state.error = action.payload;
      })

      // Fetch Trending Events
      .addCase(fetchTrendingEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingEvents.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response formats
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.trendingEvents = payload;
        } else if (payload?.events) {
          state.trendingEvents = payload.events;
        } else if (payload?.data) {
          state.trendingEvents = Array.isArray(payload.data) ? payload.data : payload.data.events || [];
        } else {
          state.trendingEvents = [];
        }
      })
      .addCase(fetchTrendingEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Organizer Dashboard
      .addCase(fetchOrganizerDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrganizerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload.data;
      })
      .addCase(fetchOrganizerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Generate Description
      .addCase(generateEventDescription.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateEventDescription.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedDescription = action.payload.description;
      })
      .addCase(generateEventDescription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Search Events
      .addCase(searchEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.events || [];
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setCurrentEvent, clearCurrentEvent, clearError } = eventSlice.actions;
export default eventSlice.reducer;