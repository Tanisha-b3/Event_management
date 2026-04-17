import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api';


// ================== HELPERS ==================

const loadCartFromStorage = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart'));

    return {
      items: Array.isArray(cart?.items) ? cart.items : [],
      total: typeof cart?.total === 'number' ? cart.total : 0
    };
  } catch {
    return { items: [], total: 0 };
  }
};

const saveCartToStorage = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
};

const calculateTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};


// ================== ASYNC THUNKS ==================

const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/cart', {
        params: { page, limit }
      });

      return {
        items: data.items || [],
        total: data.total || 0,
        pagination: data.pagination || {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: (data.items || []).length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch cart'
      );
    }
  }
);

const addToCartAsync = createAsyncThunk(
  'cart/addToCartAsync',
  async (item, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await apiClient.post('/cart/add', item);
      await dispatch(fetchCart()); // refresh cart
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to add to cart'
      );
    }
  }
);

 const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCartAsync',
  async (itemId, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await apiClient.delete(`/cart/remove/${itemId}`);
      await dispatch(fetchCart());
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to remove from cart'
      );
    }
  }
);

 const updateCartQuantityAsync = createAsyncThunk(
  'cart/updateCartQuantityAsync',
  async ({ itemId, quantity }, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await apiClient.put(`/cart/update/${itemId}`, { quantity });
      await dispatch(fetchCart());
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update cart quantity'
      );
    }
  }
);

const clearCartAsync = createAsyncThunk(
  'cart/clearCartAsync',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await apiClient.delete('/cart/clear');
      await dispatch(fetchCart());
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to clear cart'
      );
    }
  }
);

 const syncCartAsync = createAsyncThunk(
  'cart/syncCartAsync',
  async (localItems, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await apiClient.post('/cart/sync', { localItems });
      await dispatch(fetchCart());
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to sync cart'
      );
    }
  }
);

const checkout = createAsyncThunk(
  'cart/checkout',
  async (paymentDetails, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth?.token;
      const { data } = await apiClient.post('/cart/checkout', paymentDetails, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return {
        success: true,
        orderId: data.orderId || Date.now().toString(),
        data
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Checkout failed');
    }
  }
);


// ================== INITIAL STATE ==================

const initialState = {
  ...loadCartFromStorage(),
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  },
  loading: false,
  error: null,
  checkoutSuccess: false,
  checkoutData: null
};


// ================== SLICE ==================

const cartSlice = createSlice({
  name: 'cart',
  initialState,

  reducers: {
    setCart: (state, action) => {
      const { items, total } = action.payload;

      state.items = items || [];
      state.total = total || calculateTotal(state.items);

      saveCartToStorage({
        items: state.items,
        total: state.total
      });
    },

    // Local cart actions (for guests)
    addToCartLocal: (state, action) => {
      const {
        id,
        eventId,
        eventName,
        eventTitle,
        ticketType,
        price,
        quantity = 1,
        eventDate,
        eventImage,
        eventLocation
      } = action.payload;

      const name = eventName || eventTitle;

      const existingItem = state.items.find(
        (item) =>
          item.eventId === eventId &&
          item.ticketType === ticketType
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id: id || `${eventId}-${ticketType}-${Date.now()}`,
          eventId,
          eventName: name,
          ticketType,
          price,
          quantity,
          eventDate,
          eventImage,
          eventLocation
        });
      }

      state.total = calculateTotal(state.items);

      saveCartToStorage({
        items: state.items,
        total: state.total
      });
    },

    removeFromCartLocal: (state, action) => {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      );

      state.total = calculateTotal(state.items);

      saveCartToStorage({
        items: state.items,
        total: state.total
      });
    },

    updateCartQuantity: (state, action) => {
      const { id, quantity } = action.payload;

      const item = state.items.find(
        (item) => item.id === id
      );

      if (item) {
        item.quantity = Math.max(1, quantity);
        state.total = calculateTotal(state.items);
        saveCartToStorage({
          items: state.items,
          total: state.total
        });
      }
    },

    clearCartLocal: (state) => {
      state.items = [];
      state.total = 0;
      state.checkoutSuccess = false;
      state.checkoutData = null;

      saveCartToStorage({
        items: [],
        total: 0
      });
    },

    removeBookedItems: (state, action) => {
      const itemIds = action.payload;

      state.items = state.items.filter(
        (item) => !itemIds.includes(item.id)
      );

      state.total = calculateTotal(state.items);

      saveCartToStorage({
        items: state.items,
        total: state.total
      });
    },

    resetCheckout: (state) => {
      state.checkoutSuccess = false;
      state.error = null;
      state.checkoutData = null;
    },

    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearError: (state) => {
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder

      // fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
        state.pagination = {
          currentPage: action.payload.pagination?.currentPage || 1,
          itemsPerPage: action.payload.pagination?.itemsPerPage || 10,
          totalItems: action.payload.pagination?.totalItems || 0,
          totalPages: action.payload.pagination?.totalPages || 1,
          hasNextPage: action.payload.pagination?.hasNextPage || false,
          hasPrevPage: action.payload.pagination?.hasPrevPage || false
        };
        
        // Sync with localStorage for guests
        if (!localStorage.getItem('token')) {
          saveCartToStorage({
            items: state.items,
            total: state.total
          });
        }
      })

      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // add to cart async
      .addCase(addToCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state) => {
        state.loading = false;
        // Cart is updated via fetchCart
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // remove from cart async
      .addCase(removeFromCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCartAsync.fulfilled, (state) => {
        state.loading = false;
        // Cart is updated via fetchCart
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // update cart quantity async
      .addCase(updateCartQuantityAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartQuantityAsync.fulfilled, (state) => {
        state.loading = false;
        // Cart is updated via fetchCart
      })
      .addCase(updateCartQuantityAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // clear cart async
      .addCase(clearCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.loading = false;
        // Cart is updated via fetchCart
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // sync cart async
      .addCase(syncCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncCartAsync.fulfilled, (state) => {
        state.loading = false;
        // Cart is updated via fetchCart
      })
      .addCase(syncCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // checkout
      .addCase(checkout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkout.fulfilled, (state, action) => {
        state.loading = false;
        state.checkoutSuccess = true;
        state.checkoutData = action.payload;
        state.items = [];
        state.total = 0;
        state.pagination = {
          ...state.pagination,
          totalItems: 0,
          totalPages: 1,
          currentPage: 1
        };

        saveCartToStorage({
          items: [],
          total: 0
        });
      })
      .addCase(checkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.checkoutSuccess = false;
      });
  }
});


// ================== EXPORTS ==================

// Export local actions
export const {
  setCart,
  addToCartLocal,
  removeFromCartLocal,
  updateCartQuantity,
  clearCartLocal,
  removeBookedItems,
  resetCheckout,
  setPagination,
  clearError
} = cartSlice.actions;

// Export async thunks
export {
  addToCartAsync,
  removeFromCartAsync,
  updateCartQuantityAsync,
  clearCartAsync,
  syncCartAsync,
  checkout,
  fetchCart,
};

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;
export const selectCartPagination = (state) => state.cart.pagination;
export const selectCartCheckoutSuccess = (state) => state.cart.checkoutSuccess;
export const selectCartItemCount = (state) => 
  state.cart.items.reduce((count, item) => count + (item.quantity || 0), 0);

export default cartSlice.reducer;