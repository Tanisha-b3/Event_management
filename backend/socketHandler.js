import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Notification from './models/Notification.js';

let io;
const userSockets = new Map(); // Map userId to Set of socket ids

const initializeSocket = (server, allowedOrigins) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      socket.userId = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded.userId;
      next();
    } catch (err) {
      console.log('Socket auth failed:', err.message);
      socket.userId = null;
      next();
    }
  });

  const createAndEmitNotification = async (userId, payload) => {
    if (!userId) return;
    try {
      const notification = new Notification({ userId, ...payload });
      await notification.save();
      io.to(`user:${userId}`).emit('notification:new', notification);
    } catch (err) {
      console.error('Socket notification error:', err.message);
    }
  };

  io.on('connection', (socket) => {
    const userId = socket.userId ? socket.userId.toString() : null;
    console.log(`Socket connected: ${socket.id}, User: ${userId || 'anonymous'}`);

    // Register authenticated user
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined room user:${userId}`);
      
      // Broadcast online status
      socket.broadcast.emit('user:status', { userId, status: 'online' });
    }

    // ==================== CHAT EVENT HANDLERS (FIXED) ====================
    
    // Send message to specific user
    socket.on('chat:send_message', async (data) => {
      const { recipientId, conversationId, text, senderName, senderRole } = data;
      const senderId = userId;
      
      console.log(`Chat message from ${senderId} to ${recipientId}:`, text);
      
      if (!recipientId || !text) {
        console.error('Missing recipientId or text');
        return;
      }
      
      // Create message object
      const messageData = {
        id: Date.now().toString(),
        conversationId: conversationId,
        text: text,
        sender: senderId,
        senderName: senderName,
        senderRole: senderRole,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };
      
      // Emit to recipient's room
      const recipientRoom = `user:${recipientId}`;
      console.log(`Emitting to room: ${recipientRoom}`);
      
      io.to(recipientRoom).emit('chat:new_message', messageData);
      io.to(recipientRoom).emit('chat:message', messageData);
      
      // Also emit to sender for confirmation
      socket.emit('chat:message_sent', messageData);
      
      // Create notification for recipient
      await createAndEmitNotification(recipientId, {
        type: 'new_message',
        title: 'New Message',
        message: `${senderName} sent you a message`,
        data: {
          conversationId: conversationId,
          senderId: senderId,
          senderName: senderName,
          link: `/messages?conversation=${conversationId}`
        }
      });
    });
    
    // Handle typing indicator
    socket.on('chat:typing', ({ recipientId, conversationId, isTyping }) => {
      if (recipientId) {
        io.to(`user:${recipientId}`).emit('chat:typing_indicator', {
          conversationId,
          userId,
          isTyping
        });
      }
    });
    
    // Join conversation room
    socket.on('chat:join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation:${conversationId}`);
      }
    });
    
    // Leave conversation room
    socket.on('chat:leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
        console.log(`Socket ${socket.id} left conversation:${conversationId}`);
      }
    });
    
    // Mark messages as read
    socket.on('chat:mark_read', async ({ conversationId, recipientId }) => {
      if (conversationId && recipientId) {
        io.to(`user:${recipientId}`).emit('chat:read_receipt', {
          conversationId,
          userId: socket.userId
        });
      }
    });

    // ==================== CART EVENT HANDLERS ====================

    socket.on('cart:sync', (cartData) => {
      if (userId) {
        socket.to(`user:${userId}`).emit('cart:updated', cartData);
        console.log(`Cart synced for user ${userId}`);
      }
    });

    socket.on('cart:add', (item) => {
      if (userId) {
        io.to(`user:${userId}`).emit('cart:item_added', item);
        console.log(`Item added to cart for user ${userId}:`, item.eventName || item.eventTitle);

        createAndEmitNotification(userId, {
          type: 'cart_add',
          title: 'Added to Cart 🛒',
          message: `${item?.eventName || item?.eventTitle || 'Item'} added to your cart`,
          data: {
            eventId: item?.eventId,
            ticketType: item?.ticketType,
            quantity: item?.quantity,
            link: '/cart',
          },
        });
      }
    });

    socket.on('cart:remove', (itemId) => {
      if (userId) {
        io.to(`user:${userId}`).emit('cart:item_removed', itemId);
        console.log(`Item removed from cart for user ${userId}:`, itemId);

        createAndEmitNotification(userId, {
          type: 'cart_remove',
          title: 'Removed from Cart',
          message: 'An item was removed from your cart',
          data: { itemId, link: '/cart' },
        });
      }
    });

    socket.on('cart:update', ({ itemId, quantity }) => {
      if (userId) {
        io.to(`user:${userId}`).emit('cart:quantity_updated', { itemId, quantity });
        console.log(`Cart quantity updated for user ${userId}:`, { itemId, quantity });

        createAndEmitNotification(userId, {
          type: 'cart_update',
          title: 'Cart Updated',
          message: `Item quantity updated to ${quantity}`,
          data: { itemId, quantity, link: '/cart' },
        });
      }
    });

    socket.on('cart:clear', () => {
      if (userId) {
        io.to(`user:${userId}`).emit('cart:cleared');
        console.log(`Cart cleared for user ${userId}`);

        createAndEmitNotification(userId, {
          type: 'cart_clear',
          title: 'Cart Cleared',
          message: 'Your cart has been cleared',
          data: { link: '/cart' },
        });
      }
    });

    socket.on('cart:summary', async () => {
      if (userId) {
        try {
          const Cart = require('./models/Cart');
          const cart = await Cart.findOne({ userId });
          const summary = {
            itemCount: cart?.items?.length || 0,
            total: cart?.total || 0
          };
          socket.emit('cart:summary', summary);
        } catch (error) {
          console.error('Error fetching cart summary:', error);
        }
      }
    });

    // ==================== AUTH EVENT HANDLERS ====================

    socket.on('auth:login', (user) => {
      if (userId) {
        socket.to(`user:${userId}`).emit('auth:login', user || { userId });

        createAndEmitNotification(userId, {
          type: 'auth_login',
          title: 'Signed In',
          message: 'You signed in on another device',
          data: { 
            userAgent: socket.handshake.headers['user-agent'],
            timestamp: new Date().toISOString()
          },
        });
      }
    });

    socket.on('auth:logout', () => {
      if (userId) {
        socket.to(`user:${userId}`).emit('auth:logout');
        console.log(`User ${userId} logged out from another device`);
      }
    });

    socket.on('auth:register', (user) => {
      if (userId) {
        socket.to(`user:${userId}`).emit('auth:register', user || { userId });

        createAndEmitNotification(userId, {
          type: 'auth_register',
          title: 'Welcome! 🎉',
          message: 'Your account has been created successfully',
          data: { link: '/dashboard' },
        });
      }
    });

    // ==================== NOTIFICATION HANDLERS ====================

    socket.on('notification:read', async (notificationId) => {
      if (userId) {
        try {
          await Notification.findByIdAndUpdate(notificationId, { read: true });
          socket.to(`user:${userId}`).emit('notification:marked_read', notificationId);
          io.to(`user:${userId}`).emit('notification:marked_read', notificationId);
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    });

    socket.on('notification:read_all', async () => {
      if (userId) {
        try {
          await Notification.updateMany({ userId, read: false }, { read: true });
          socket.to(`user:${userId}`).emit('notifications:all_read');
          io.to(`user:${userId}`).emit('notifications:all_read');
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
        }
      }
    });

    socket.on('notification:count', async () => {
      if (userId) {
        try {
          const count = await Notification.countDocuments({ userId, read: false });
          socket.emit('notification:count', count);
        } catch (error) {
          console.error('Error fetching notification count:', error);
        }
      }
    });

    // ==================== EVENT HANDLERS ====================

    socket.on('event:join', (eventId) => {
      if (eventId) {
        socket.join(`event:${eventId}`);
        console.log(`Socket ${socket.id} joined event:${eventId}`);
      }
    });

    socket.on('event:leave', (eventId) => {
      if (eventId) {
        socket.leave(`event:${eventId}`);
        console.log(`Socket ${socket.id} left event:${eventId}`);
      }
    });

    socket.on('event:ticket_sold', (data) => {
      if (data.eventId && userId) {
        io.to(`event:${data.eventId}`).emit('event:ticket_sold', {
          eventId: data.eventId,
          ticketType: data.ticketType,
          quantity: data.quantity,
          remainingCapacity: data.remainingCapacity
        });
      }
    });

    // ==================== USER PRESENCE ====================

    socket.on('room:join', (roomId) => {
      if (roomId) {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room:${roomId}`);
      }
    });

    socket.on('room:leave', (roomId) => {
      if (roomId) {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room:${roomId}`);
      }
    });

    socket.on('user:online', () => {
      if (userId) {
        socket.broadcast.emit('user:status', { userId, status: 'online' });
      }
    });

    // ==================== DISCONNECT HANDLER ====================

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
      
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          socket.broadcast.emit('user:status', { userId, status: 'offline' });
        }
      }
    });
  });

  return io;
};

// Helper functions
const emitToUser = (userId, event, data) => {
  if (io) {
    const userIdStr = userId.toString();
    console.log(`Emitting ${event} to user:${userIdStr}`);
    io.to(`user:${userIdStr}`).emit(event, data);
  }
};

const emitToEvent = (eventId, event, data) => {
  if (io) {
    io.to(`event:${eventId}`).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const getIO = () => io;

const isUserOnline = (userId) => {
  const userIdStr = userId.toString();
  return userSockets.has(userIdStr) && userSockets.get(userIdStr).size > 0;
};

const getUserSockets = (userId) => {
  const userIdStr = userId.toString();
  return userSockets.get(userIdStr) || new Set();
};

const getOnlineUsers = () => {
  return Array.from(userSockets.keys());
};

export default {
  initializeSocket,
  emitToUser,
  emitToEvent,
  emitToAll,
  getIO,
  isUserOnline,
  getUserSockets,
  getOnlineUsers
};