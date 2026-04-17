const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true // ✅ faster queries
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true // ✅ clean data
    },
    attachments: [{ type: String }],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },

    lastMessageText: {
      type: String,
      default: ''
    },

    subject: {
      type: String,
      default: 'New conversation'
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);


// ✅ Prevent duplicate conversations between same users
conversationSchema.index({ participants: 1 });

// ✅ Fast sorting
conversationSchema.index({ updatedAt: -1 });

// ✅ Ensure at least 2 participants (VERY IMPORTANT)
conversationSchema.pre('save', function (next) {
  if (!this.participants || this.participants.length < 2) {
    return next(new Error('Conversation must have at least 2 participants'));
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Message, Conversation };