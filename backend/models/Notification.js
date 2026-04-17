const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
type: {
    type: String,
    enum: [
      'ticket_booked',
      'ticket_cancelled',
      'event_reminder',
      'event_update',
      'event_cancelled',
      'event_approved',
      'event_rejected',
      'payment_success',
      'payment_failed',
      'new_event',
      'cart_add',
      'cart_remove',
      'cart_clear',
      'cart_reminder',
      'auth_login',
      'auth_register',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    link: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
