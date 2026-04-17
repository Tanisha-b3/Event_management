import express from 'express';

const router = express.Router();

import Cart from '../models/Cart.js';
import Event from '../models/Events.js';
import AuthMiddleware from '../middleware/Auth.js';
import socketHandler from '../socketHandler.js';
const { auth: protect } = AuthMiddleware;

const { emitToUser } = socketHandler;

// Helper to create cart notification
const createCartNotification = async (userId, type, title, message, data = {}) => {
  try {
    // Validate userId is provided
    if (!userId) {
      console.error('createCartNotification called without userId');
      return null;
    }
    
    const Notification = require('../models/Notification');
    const notification = new Notification({
      userId, // Ensure this is the correct user's ID
      type,
      title,
      message,
      data
    });
    await notification.save();
    emitToUser(userId, 'notification:new', notification);
    // console.log('Notification created for user:', userId, 'type:', type);
    return notification;
  } catch (error) {
    console.error('Error creating cart notification:', error);
    return null;
  }
};

// Get user's cart (with pagination)
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cart = await Cart.getOrCreate(req.user.id);
    
    // Populate event details
    await cart.populate('items.eventId', 'title date location category imageName capacity');

    const totalItems = cart.items.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Paginate items
    const paginatedItems = cart.items.slice(skip, skip + limit);

    res.json({
      success: true,
      items: paginatedItems,
      total: cart.total,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
  try {
    const { 
      eventId, 
      eventName, 
      eventDate, 
      eventLocation,
      eventImage, 
      ticketType, 
      price, 
      quantity = 1 
    } = req.body;

    // Validation
    if (!eventId || !price) {
      return res.status(400).json({ error: 'Event ID and price are required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Check if event exists and has capacity
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get or create cart
    const cart = await Cart.getOrCreate(req.user.id);

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      item => item.eventId.toString() === eventId && item.ticketType === ticketType
    );

    if (existingItemIndex > -1) {
      // Update quantity if exists
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check capacity limit
      if (event.capacity && event.capacity < newQuantity) {
        return res.status(400).json({ 
          error: `Only ${event.capacity} tickets available for this event` 
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        eventId,
        eventName: eventName || event.title,
        eventDate: eventDate || event.date,
        eventLocation: eventLocation || event.location,
        eventImage: eventImage || event.imageName,
        ticketType: ticketType || 'General Admission',
        price,
        quantity
      });
    }

    await cart.save();

    // Emit real-time update to user's other devices
    emitToUser(req.user.id, 'cart:item_added', {
      itemId: cart.items[existingItemIndex]?._id || cart.items[cart.items.length - 1]._id,
      eventId,
      quantity,
      cartTotal: cart.total
    });

    // Send notification
    await createCartNotification(
      req.user.id,
      'cart_add',
      'Added to Cart 🛒',
      `${eventName || event.title} has been added to your cart`,
      { eventId, quantity, link: '/cart' }
    );

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: {
        items: cart.items,
        total: cart.total,
        itemCount: cart.items.length
      }
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', protect, async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const removedItem = cart.items.id(itemId);
    if (!removedItem) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    const eventName = removedItem.eventName;
    await cart.removeItem(itemId);

    // Emit real-time update
    emitToUser(req.user.id, 'cart:item_removed', { itemId, cartTotal: cart.total });

    // Send notification
    await createCartNotification(
      req.user.id,
      'cart_remove',
      'Removed from Cart',
      `${eventName} has been removed from your cart`,
      { itemId, link: '/cart' }
    );

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        items: cart.items,
        total: cart.total,
        itemCount: cart.items.length
      }
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// Update cart item quantity
router.put('/update/:itemId', protect, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Check capacity limit
    const event = await Event.findById(item.eventId);
    if (event && event.capacity && event.capacity < quantity) {
      return res.status(400).json({ 
        error: `Only ${event.capacity} tickets available for this event` 
      });
    }

    await cart.updateQuantity(itemId, quantity);

    // Emit real-time update
    emitToUser(req.user.id, 'cart:quantity_updated', { 
      itemId, 
      quantity, 
      cartTotal: cart.total 
    });

    res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: {
        items: cart.items,
        total: cart.total,
        itemCount: cart.items.length
      }
    });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    res.status(500).json({ error: 'Failed to update cart quantity' });
  }
});

// Clear entire cart
router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      await cart.clearCart();
      
      // Emit real-time update
      emitToUser(req.user.id, 'cart:cleared', {});
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: { items: [], total: 0, itemCount: 0 }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Sync local cart with server cart (merge)
router.post('/sync', protect, async (req, res) => {
  try {
    const { localItems } = req.body;
    
    if (!Array.isArray(localItems)) {
      return res.status(400).json({ error: 'localItems must be an array' });
    }

    const cart = await Cart.getOrCreate(req.user.id);

    // Merge local items with server cart
    for (const localItem of localItems) {
      if (!localItem.eventId || !localItem.price) continue;

      // Check if event exists
      const event = await Event.findById(localItem.eventId);
      if (!event) continue;

      const existingIndex = cart.items.findIndex(
        item => item.eventId.toString() === localItem.eventId && 
                item.ticketType === localItem.ticketType
      );

      if (existingIndex > -1) {
        // Merge quantities
        cart.items[existingIndex].quantity += localItem.quantity || 1;
      } else {
        // Add new item
        cart.items.push({
          eventId: localItem.eventId,
          eventName: localItem.eventName || event.title,
          eventDate: localItem.eventDate || event.date,
          eventLocation: localItem.eventLocation || event.location,
          eventImage: localItem.eventImage || event.imageName,
          ticketType: localItem.ticketType || 'General Admission',
          price: localItem.price,
          quantity: localItem.quantity || 1
        });
      }
    }

    await cart.save();

    // Emit real-time update
    emitToUser(req.user.id, 'cart:updated', { 
      items: cart.items, 
      total: cart.total,
      itemCount: cart.items.length 
    });

    res.json({
      success: true,
      message: 'Cart synced successfully',
      cart: {
        items: cart.items,
        total: cart.total,
        itemCount: cart.items.length
      }
    });
  } catch (error) {
    console.error('Error syncing cart:', error);
    res.status(500).json({ error: 'Failed to sync cart' });
  }
});

// Get cart summary (count and total)
router.get('/summary', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    
    res.json({
      success: true,
      itemCount: cart?.items?.length || 0,
      total: cart?.total || 0
    });
  } catch (error) {
    console.error('Error fetching cart summary:', error);
    res.status(500).json({ error: 'Failed to fetch cart summary' });
  }
});

export default router;