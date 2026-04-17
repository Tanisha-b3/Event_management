import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api';

const API_PATH = '/favorites';

// Accepts { page, limit } as argument
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchAll',
  async ({ page = 1, limit = 12 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(API_PATH, { params: { page, limit } });
      return {
        favorites: data.favorites || [],
        pagination: data.pagination || { page, limit, total: (data.favorites || []).length, pages: 1 }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load saved events');
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/add',
  async ({ eventId, eventData }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(API_PATH, { eventId });
      return data.favorite || data.item || data || { eventId, ...eventData };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to save event');
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/remove',
  async (eventId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`${API_PATH}/${eventId}`);
      return eventId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to remove saved event');
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 12, total: 0, pages: 1 },
  },
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.favorites || [];
        state.pagination = action.payload.pagination || { page: 1, limit: 12, total: 0, pages: 1 };
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        const fav = action.payload;
        const id = fav._id || fav.id || fav.eventId;
        const exists = state.items.some((item) => (item._id || item.id || item.eventId) === id);
        if (!exists) {
          state.items.unshift(fav);
        }
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((item) => (item._id || item.id || item.eventId) !== id);
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
