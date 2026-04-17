import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api';

export const fetchMyEvents = createAsyncThunk(
  'analytics/fetchMyEvents',
  async (token, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/events?myEvents=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.events || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
    }
  }
);

export const fetchEventAnalytics = createAsyncThunk(
  'analytics/fetchEventAnalytics',
  async ({ eventId, token, period = '30' }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Analytics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Analytics error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

const initialState = {
  events: [],
  selectedEvent: null,
  analytics: null,
  loading: false,
  analyticsLoading: false,
  error: null,
  analyticsError: null,
  period: '30',
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
    },
    setPeriod: (state, action) => {
      state.period = action.payload;
    },
    clearAnalytics: (state) => {
      state.events = [];
      state.selectedEvent = null;
      state.analytics = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
        if (action.payload.length > 0 && !state.selectedEvent) {
          state.selectedEvent = action.payload[0];
        }
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEventAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchEventAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        const data = action.payload;
        state.analytics = {
          totalTickets: data.totalTickets || 0,
          soldTickets: data.soldTickets || 0,
          revenue: data.revenue || 0,
          views: data.views || 0,
          attendees: data.attendees || 0,
          ticketsByType: data.ticketsByType || [],
          salesByDate: data.salesByDate || []
        };
      })
      .addCase(fetchEventAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
      });
  },
});

export const { setSelectedEvent, setPeriod, clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
