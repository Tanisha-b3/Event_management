import { io } from 'socket.io-client';
import { store } from '../store';
import { addNotification, markNotificationRead, markAllNotificationsRead } from '../store/slices/notificationSlice';
import { setCart, fetchCart } from '../store/slices/cartSlice';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.eventQueue = [];
    this.isReconnecting = false;
    this.reconnectTimeout = null;
    this.heartbeatInterval = null;
    this.lastPongTime = null;
    this.pingTimeout = 30000;
    this.handlersRegistered = false;
  }

  // FIX 3: Centralized userId resolution — no more mismatched localStorage keys
  _getUserId() {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?._id || user?.id || null;
  }

  ensureConnected() {
    if (!this.socket || !this.socket.connected) {
      this.connect();
      return false;
    }
    return true;
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.cleanup();
    }

    const token = localStorage.getItem('token');
    const userId = this._getUserId();

    this.socket = io(SOCKET_URL, {
      auth: { token, userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      forceNew: true,
    });

    this.setupEventHandlers();
    this.setupHeartbeat();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket || this.handlersRegistered) return;
    this.handlersRegistered = true;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.flushEventQueue();
      // FIX 3: Use centralized userId resolver
      this.socket?.emit('user:online', { userId: this._getUserId() });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.flushEventQueue();
    });

    this.socket.on('reconnecting', (attemptNumber) => {
      console.log('🔄 Socket reconnecting attempt:', attemptNumber);
      this.isReconnecting = true;
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.stopHeartbeat();

      if (reason === 'io server disconnect') {
        setTimeout(() => this.connect(), 1000);
      } else if (reason === 'transport close') {
        console.log('Transport closed, waiting for reconnection...');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.reconnectAttempts++;
      this.emitGlobalError('connection_error', error);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emitGlobalError('socket_error', error);
    });

    this.socket.on('pong', (latency) => {
      this.lastPongTime = Date.now();
      if (latency > 1000) {
        console.warn('⚠️ High latency detected:', latency, 'ms');
      }
    });

    // Notification events
    this.socket.on('notification:new', (notification) => {
      console.log('🔔 New notification received:', notification._id, notification.title);
      store.dispatch(addNotification(notification));
      this.showBrowserNotification(notification);
    });

    this.socket.on('notification:marked_read', (notificationId) => {
      store.dispatch(markNotificationRead(notificationId));
    });

    this.socket.on('notifications:all_read', () => {
      store.dispatch(markAllNotificationsRead());
    });

    // Cart events
    this.socket.on('cart:updated', (cart) => {
      if (cart && cart.items) {
        console.log('🛒 Cart synced from server:', cart);
        store.dispatch(setCart(cart));
      }
      store.dispatch(fetchCart());
    });

    this.socket.on('cart:item_added', (item) => {
      if (item) {
        console.log('🛒 Item added to cart:', item);
        store.dispatch(fetchCart());
      }
    });

    this.socket.on('cart:item_removed', (itemId) => {
      if (itemId) {
        console.log('🛒 Item removed from cart:', itemId);
        store.dispatch(fetchCart());
      }
    });

    this.socket.on('cart:cleared', () => {
      console.log('🛒 Cart cleared');
      store.dispatch(fetchCart());
    });

    // Event updates
    this.socket.on('event:updated', (eventData) => {
      console.log('📅 Event updated:', eventData);
      this.emitGlobalEvent('event_updated', eventData);
    });

    this.socket.on('event:ticket_sold', (data) => {
      console.log('🎫 Ticket sold for event:', data);
      this.emitGlobalEvent('ticket_sold', data);
    });

    this.socket.on('event:capacity_update', (data) => {
      console.log('📊 Event capacity updated:', data);
      this.emitGlobalEvent('capacity_update', data);
    });

    // User presence events
    this.socket.on('user:status', (data) => {
      console.log('👤 User status update:', data);
      this.emitGlobalEvent('user_status', data);
    });

    this.socket.on('user:typing', (data) => {
      this.emitGlobalEvent('user_typing', data);
    });

    // ==================== CHAT EVENTS ====================

    this.socket.on('chat:new_message', (message) => {
      console.log('💬 New chat message received:', message);
      this.emitGlobalEvent('chat:new_message', message);
    });

    this.socket.on('chat:message', (message) => {
      console.log('💬 Chat message received:', message);
      this.emitGlobalEvent('chat:message', message);
    });

    this.socket.on('chat:message_sent', (message) => {
      console.log('✅ Message sent confirmation:', message);
      this.emitGlobalEvent('chat:message_sent', message);
    });

    this.socket.on('chat:typing_indicator', (data) => {
      this.emitGlobalEvent('chat:typing_indicator', data);
    });

    this.socket.on('chat:read_receipt', (data) => {
      this.emitGlobalEvent('chat:read_receipt', data);
    });
  }

  setupHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        const start = Date.now();
        this.socket.emit('ping', () => {
          const latency = Date.now() - start;
          this.lastPongTime = Date.now();

          if (this.lastPongTime && (Date.now() - this.lastPongTime) > this.pingTimeout) {
            console.warn('⚠️ Connection seems stale, reconnecting...');
            this.reconnect();
          }
        });
      }
    }, 15000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
      setTimeout(() => {
        this.socket.connect();
      }, 100);
    } else {
      this.connect();
    }
  }

  flushEventQueue() {
    while (this.eventQueue.length > 0) {
      const { event, data } = this.eventQueue.shift();
      this.socket?.emit(event, data);
    }
  }

  queueEvent(event, data) {
    this.eventQueue.push({ event, data });
    if (this.eventQueue.length > 100) {
      this.eventQueue.shift();
    }
  }

  emitWithQueue(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.queueEvent(event, data);
    }
  }

  emitGlobalEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  emitGlobalError(errorType, error) {
    if (this.listeners.has('error')) {
      this.listeners.get('error').forEach(callback => {
        try {
          callback({ type: errorType, error });
        } catch (err) {
          console.error('Error in error handler:', err);
        }
      });
    }
  }

  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'New Notification', {
        body: notification.message || notification.body,
        icon: notification.icon || '/logo192.png',
        badge: '/favicon.ico',
        silent: false,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  reconnectWithAuth(token) {
    if (this.socket) {
      this.socket.auth = { token };
      this.socket.disconnect();
      setTimeout(() => {
        this.socket.connect();
      }, 100);
    } else {
      this.connect();
    }
  }

  // FIX 2: Don't reconnect just to update auth — update in-place, only reconnect if disconnected
  updateAuth(token, userId) {
    if (this.socket) {
      this.socket.auth = { token, userId };
      // Only reconnect if already disconnected; don't force-disconnect an active session
      if (!this.socket.connected) {
        this.socket.connect();
      }
    } else {
      this.connect();
    }
  }

  // ==================== CHAT METHODS ====================

  sendMessage(recipientId, conversationId, text, senderName, senderRole) {
    if (!recipientId || !text) {
      console.error('Missing recipientId or text');
      return;
    }

    const messageData = {
      recipientId,
      conversationId,
      text,
      senderName,
      senderRole,
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Sending message to ${recipientId}:`, text);
    this.emitWithQueue('chat:send_message', messageData);
  }

  sendTypingIndicator(recipientId, conversationId, isTyping) {
    if (recipientId) {
      this.emitWithQueue('chat:typing', { recipientId, conversationId, isTyping });
    }
  }

  joinConversation(conversationId) {
    if (conversationId) {
      this.emitWithQueue('chat:join_conversation', conversationId);
      console.log(`📢 Joined conversation: ${conversationId}`);
    }
  }

  leaveConversation(conversationId) {
    if (conversationId) {
      this.emitWithQueue('chat:leave_conversation', conversationId);
      console.log(`👋 Left conversation: ${conversationId}`);
    }
  }

  markMessagesAsRead(conversationId, recipientId) {
    if (conversationId && recipientId) {
      this.emitWithQueue('chat:mark_read', { conversationId, recipientId });
    }
  }

  onNewMessage(callback) {
    this.on('chat:new_message', callback);
    this.on('chat:message', callback);
  }

  onMessageSent(callback) {
    this.on('chat:message_sent', callback);
  }

  onTypingIndicator(callback) {
    this.on('chat:typing_indicator', callback);
  }

  onReadReceipt(callback) {
    this.on('chat:read_receipt', callback);
  }

  // ==================== LEGACY CHAT METHODS ====================

  /** @deprecated use sendMessage */
  sendChatMessage(roomId, message) {
    console.warn('sendChatMessage is deprecated, use sendMessage instead');
    this.emitWithQueue('chat:message', { roomId, message, timestamp: Date.now() });
  }

  /** @deprecated use sendTypingIndicator */
  sendTyping(roomId, isTyping) {
    console.warn('sendTyping is deprecated, use sendTypingIndicator instead');
    this.emitWithQueue('chat:typing', { roomId, isTyping });
  }

  // ==================== CART METHODS ====================

  syncCart(cartData) {
    this.emitWithQueue('cart:sync', cartData);
  }

  emitCartAdd(item) {
    this.emitWithQueue('cart:add', item);
  }

  emitCartRemove(itemId) {
    this.emitWithQueue('cart:remove', itemId);
  }

  emitCartClear() {
    this.emitWithQueue('cart:clear');
  }

  // ==================== AUTH METHODS ====================

  emitAuthLogin(user) {
    this.emitWithQueue('auth:login', user);
  }

  emitAuthRegister(user) {
    this.emitWithQueue('auth:register', user);
  }

  // ==================== NOTIFICATION METHODS ====================

  emitNotificationRead(notificationId) {
    this.socket?.emit('notification:read', notificationId);
  }

  emitNotificationsReadAll() {
    this.socket?.emit('notification:read_all');
  }

  // ==================== EVENT METHODS ====================

  joinEvent(eventId) {
    this.socket?.emit('event:join', eventId);
  }

  leaveEvent(eventId) {
    this.socket?.emit('event:leave', eventId);
  }

  // ==================== ROOM METHODS ====================

  joinRoom(roomId) {
    this.socket?.emit('room:join', roomId);
  }

  leaveRoom(roomId) {
    this.socket?.emit('room:leave', roomId);
  }

  // ==================== GENERAL METHODS ====================

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  // FIX 1: Removed duplicate this.socket?.on(event, callback) — all events flow through
  // setupEventHandlers → emitGlobalEvent → listeners map. Adding raw socket.on here
  // caused duplicate callbacks and re-registration after reconnect.
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      if (callback) {
        this.listeners.get(event).delete(callback);
      } else {
        this.listeners.get(event).clear();
      }
    }
  }

  removeAllListeners() {
    this.listeners.clear();
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      // FIX 3: Use centralized userId resolver
      this.socket.emit('user:offline', { userId: this._getUserId() });
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventQueue = [];
    this.listeners.clear();
  }

  cleanup() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlersRegistered = false;
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts,
      isReconnecting: this.isReconnecting,
      eventQueueSize: this.eventQueue.length,
    };
  }
}

export const socketService = new SocketService();

export const initializeSocket = () => {
  const token = localStorage.getItem('token');
  if (token) {
    socketService.connect();
  }
  return socketService;
};

export const cleanupSocket = () => {
  socketService.disconnect();
};

export default socketService;