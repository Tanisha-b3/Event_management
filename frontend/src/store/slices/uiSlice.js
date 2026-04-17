import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    cartDrawerOpen: false,
  },
  reducers: {
    openCartDrawer: (state) => {
      state.cartDrawerOpen = true;
    },
    closeCartDrawer: (state) => {
      state.cartDrawerOpen = false;
    },
    toggleCartDrawer: (state) => {
      state.cartDrawerOpen = !state.cartDrawerOpen;
    },
  },
});

export const { openCartDrawer, closeCartDrawer, toggleCartDrawer } = uiSlice.actions;
export default uiSlice.reducer;