import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (token, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Orders response:', response.data);
      return response.data.tickets || response.data || [];
    } catch (error) {
      console.error('Orders error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

const initialState = {
  orders: [],
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrders: (state) => {
      state.orders = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer;
