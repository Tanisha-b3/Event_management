import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
  GlobalStyles,
  SwipeableDrawer,
  Chip,
  Skeleton,
  Stack,
  LinearProgress,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Close,
  ShoppingCart as CartIcon,
  Delete,
  Add,
  Remove,
  Event,
  LocalOffer,
  CalendarToday,
  LocationOn,
  ArrowForward,
  Warning,
  ShoppingBag,
  Discount,
  CreditCard,
  Security,
  LocalShipping,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import { 
  removeFromCartAsync, 
  clearCartAsync, 
  fetchCart, 
  updateCartQuantityAsync,
  removeFromCartLocal,
  updateCartQuantity,
  clearCartLocal,
} from '../store/slices/cartSlice';
import { closeCartDrawer, openCartDrawer } from '../store/slices/uiSlice';
import { AnimatePresence, motion } from 'framer-motion';
import socketService from '../utils/socketService';
import { useEffect, useRef } from 'react';
import './CartDrawer.css';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector((state) => state.ui.cartDrawerOpen);
  const { items, total, pagination, loading, error } = useSelector((state) => state.cart);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === 'dark';
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  
  const [cartPage, setCartPage] = useState(1);
  const [cartPerPage, setCartPerPage] = useState(10);
  const debounceTimeout = useRef();
  const [removingItemId, setRemovingItemId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (open && isAuthenticated) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        dispatch(fetchCart({ page: cartPage, limit: cartPerPage }));
      }, 200);
    }
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [open, isAuthenticated, cartPage, cartPerPage, dispatch]);
  
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  // const [removeItemId, setRemoveItemId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleClose = useCallback(() => {
    dispatch(closeCartDrawer());
  }, [dispatch]);

  const totalItems = useMemo(() => items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0, [items]);
  const grandTotal = useMemo(() => total || 0, [total]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
    }
  }, [error, showSnackbar]);

  const handleRemoveItem = useCallback(async (itemId, itemName) => {
    setRemovingItemId(itemId);
    
    try {
      if (isAuthenticated) {
        await dispatch(removeFromCartAsync(itemId)).unwrap();
        showSnackbar(`${itemName} removed from cart`, 'success');
        dispatch(fetchCart({ page: cartPage, limit: cartPerPage }));
      } else {
        dispatch(removeFromCartLocal(itemId));
        showSnackbar(`${itemName} removed from cart`, 'success');
      }
      socketService.emitCartRemove(itemId);
    } catch (err) {
      showSnackbar(`Failed to remove ${itemName}: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setTimeout(() => setRemovingItemId(null), 300);
    }
  }, [dispatch, isAuthenticated, showSnackbar, cartPage, cartPerPage]);

  const handleUpdateQuantity = useCallback(async (itemId, newQuantity, itemName) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId, itemName);
    } else {
      setUpdatingItemId(itemId);
      try {
        if (isAuthenticated) {
          await dispatch(updateCartQuantityAsync({ itemId, quantity: newQuantity })).unwrap();
          dispatch(fetchCart({ page: cartPage, limit: cartPerPage }));
        } else {
          dispatch(updateCartQuantity({ id: itemId, quantity: newQuantity }));
        }
      } catch (err) {
        showSnackbar(`Failed to update quantity: ${err.message}`, 'error');
      } finally {
        setTimeout(() => setUpdatingItemId(null), 300);
      }
    }
  }, [dispatch, handleRemoveItem, isAuthenticated, showSnackbar, cartPage, cartPerPage]);

  const handleCheckout = useCallback(() => {
    if (!isAuthenticated) {
      showSnackbar('Please login to proceed with checkout', 'warning');
      handleClose();
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (!items || items.length === 0) {
      showSnackbar('Your cart is empty', 'error');
      return;
    }
    handleClose();
    navigate('/book-event', { 
      state: { 
        cartItems: items,
        fromCart: true
      } 
    });
  }, [isAuthenticated, showSnackbar, handleClose, navigate, items]);

  const handleClearCart = useCallback(() => {
    setConfirmClearOpen(true);
  }, []);

  const confirmClearCart = useCallback(async () => {
    try {
      if (isAuthenticated) {
        await dispatch(clearCartAsync()).unwrap();
        dispatch(fetchCart({ page: 1, limit: cartPerPage }));
      } else {
        dispatch(clearCartLocal());
      }
      setConfirmClearOpen(false);
      showSnackbar('Cart cleared successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to clear cart', 'error');
    }
  }, [dispatch, showSnackbar, isAuthenticated, cartPerPage]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price || 0);
  }, []);

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 }
  };

  const SavingBadge = ({ savings }) => {
    if (!savings || savings <= 0) return null;
    return (
      <Chip
        icon={<Discount />}
        label={`Save ${formatPrice(savings)}`}
        size="small"
        sx={{
          bgcolor: 'success.main',
          color: 'white',
          '& .MuiChip-icon': { color: 'white' }
        }}
      />
    );
  };

  return (
    <>
      <SwipeableDrawer
        anchor="right"
        open={open}
        onClose={handleClose}
        onOpen={() => {}}
        disableSwipeToOpen={false}
        swipeAreaWidth={30}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          className: `cart-drawer-paper ${isDark ? 'dark-mode' : 'light-mode'}`,
          sx: {
            width: { xs: '100%', sm: 480, md: 520 },
            maxWidth: '100%',
            height: '100vh',
            bgcolor: 'background.default',
          },
        }}
      >
        {/* Header */}
        <Box className="cart-header">
          <Box className="cart-header-content">
            <Zoom in>
              <Badge 
                badgeContent={totalItems} 
                color="primary" 
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    height: '22px',
                    minWidth: '22px',
                    animation: totalItems > 0 ? 'pulse 1s infinite' : 'none',
                  }
                }}
              >
                <ShoppingBag className="cart-icon" />
              </Badge>
            </Zoom>
            <Typography variant="h5" className="cart-title">
              Your Cart
            </Typography>
            {totalItems > 0 && (
              <Chip 
                label={`${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
                size="small"
                className="cart-items-chip"
              />
            )}
          </Box>
          <IconButton onClick={handleClose} className="close-button">
            <Close />
          </IconButton>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box className="cart-loading">
            <LinearProgress className="loading-progress" />
            <Stack spacing={2} sx={{ width: '100%', mt: 3 }}>
              {[1, 2, 3].map((i) => (
                <Paper key={i} className="skeleton-item">
                  <Skeleton variant="rectangular" width={80} height={80} sx={{ borderRadius: 2 }} />
                  <Box sx={{ flex: 1, ml: 2 }}>
                    <Skeleton variant="text" width="70%" height={32} />
                    <Skeleton variant="text" width="50%" height={20} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Empty Cart */}
        {!loading && (!items || items.length === 0) && (
          <Box className="empty-cart">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <ShoppingBag className="empty-cart-icon" />
            </motion.div>
            <Typography variant="h5" className="empty-cart-title">
              Your cart is empty
            </Typography>
            <Typography variant="body2" className="empty-cart-subtitle">
              Looks like you haven't added any tickets yet
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                handleClose();
                navigate('/discover');
              }}
              className="discover-button"
              startIcon={<Event />}
            >
              Discover Events
            </Button>
          </Box>
        )}

        {/* Cart Items */}
        {!loading && items && items.length > 0 && (
          <>
            <List className="cart-items-list">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id || item._id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    transition={{ duration: 0.3 }}
                  >
                    <Paper className={`cart-item-card ${removingItemId === (item.id || item._id) ? 'removing' : ''}`}>
                      <ListItem className="cart-item">
                        <ListItemAvatar>
                          <Avatar
                            variant="rounded"
                            src={item.eventImage}
                            className="item-image"
                          >
                            <Event />
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Typography className="item-name">
                              {item.eventName}
                            </Typography>
                          }
                          secondary={
                            <Box className="item-details">
                              <Box className="item-meta">
                                <CalendarToday className="meta-icon" />
                                <Typography variant="caption">{item.eventDate}</Typography>
                              </Box>
                              <Box className="item-meta">
                                <LocationOn className="meta-icon" />
                                <Typography variant="caption">{item.eventLocation || 'TBD'}</Typography>
                              </Box>
                              <Box className="item-meta">
                                <LocalOffer className="meta-icon" />
                                <Typography variant="caption">{item.ticketType}</Typography>
                              </Box>
                            </Box>
                          }
                        />
                        
                        <Box className="item-actions">
                          <Typography className="item-total">
                            {formatPrice((item.price || 0) * (item.quantity || 0))}
                          </Typography>
                          
                          <Box className="quantity-controls">
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(item.id || item._id, (item.quantity || 0) - 1, item.eventName)}
                              className="quantity-btn"
                              disabled={updatingItemId === (item.id || item._id)}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                            
                            <Typography className="quantity-value">
                              {item.quantity || 0}
                            </Typography>
                            
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(item.id || item._id, (item.quantity || 0) + 1, item.eventName)}
                              className="quantity-btn"
                              disabled={updatingItemId === (item.id || item._id)}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                            
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(item.id || item._id, item.eventName)}
                              className="delete-btn"
                              disabled={removingItemId === (item.id || item._id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                          
                          <Typography className="item-price">
                            {formatPrice(item.price)} each
                          </Typography>
                        </Box>
                      </ListItem>
                    </Paper>
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>

            {/* Order Summary */}
            <Box className="order-summary">
              <Typography variant="h6" className="summary-title">
                Order Summary
              </Typography>
              
              <Box className="summary-details">
                <Box className="summary-row">
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">{formatPrice(grandTotal)}</Typography>
                </Box>
                
                <Box className="summary-row">
                  <Typography variant="body2">Service Fee</Typography>
                  <Typography variant="body2">{formatPrice(grandTotal * 0.05)}</Typography>
                </Box>
                
                <Box className="summary-row">
                  <Typography variant="body2">Tax (10%)</Typography>
                  <Typography variant="body2">{formatPrice(grandTotal * 0.1)}</Typography>
                </Box>
                
                <Divider className="summary-divider" />
                
                <Box className="summary-row total">
                  <Typography variant="h6" fontWeight="bold">
                    Total Amount
                  </Typography>
                  <Typography variant="h5" className="total-amount">
                    {formatPrice(grandTotal + (grandTotal * 0.05) + (grandTotal * 0.1))}
                  </Typography>
                </Box>
              </Box>
              
             
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCheckout}
                className="checkout-button"
                endIcon={<ArrowForward />}
              >
                Proceed to Checkout
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearCart}
                className="clear-cart-button"
                startIcon={<Warning />}
              >
                Clear Cart
              </Button>
            </Box>
          </>
        )}
      </SwipeableDrawer>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmClearOpen} 
        onClose={() => setConfirmClearOpen(false)}
        PaperProps={{ className: 'dialog-paper' }}
      >
        <DialogTitle className="dialog-title">
          <Warning className="dialog-icon" />
          Clear Cart?
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="dialog-text">
            Are you sure you want to remove all items from your cart? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setConfirmClearOpen(false)} className="cancel-btn">
            Cancel
          </Button>
          <Button onClick={confirmClearCart} className="confirm-clear-btn">
            Clear Cart
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled"
          icon={snackbar.severity === 'success' ? <CheckCircle /> : <ErrorOutline />}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export const CartButton = () => {
  const dispatch = useDispatch();

  const { items = [] } = useSelector((state) => state.cart || {});
  const { mode } = useSelector((state) => state.theme);

  const isDark = mode === 'dark';

  const itemCount = items.reduce(
    (count, item) => count + (item.quantity || 0),
    0
  );

  return (
    <IconButton
      className="cart-button"
      onClick={() => dispatch(openCartDrawer())}
      sx={{
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        color: isDark ? '#e2e8f0' : '#1e293b',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        transition: 'all 0.3s ease',

        '&:hover': {
          backgroundColor: isDark ? '#334155' : '#e2e8f0',
        },
      }}
    >
      <Badge
        badgeContent={itemCount}
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: isDark ? '#ef4444' : '#dc2626',
            color: '#fff',
            animation: itemCount > 0 ? 'pulse 1s infinite' : 'none',
          },
        }}
      >
        <CartIcon />
      </Badge>
    </IconButton>
  );
};

export default CartDrawer;