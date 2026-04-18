import express from 'express';
import mongoose from 'mongoose';
import  User from '../models/User.js';
const router = express.Router();

import { Message, Conversation } from '../models/Message.js';
import authMiddleware from '../middleware/Auth.js';
const { auth: protect } = authMiddleware;
import socketHandler from '../socketHandler.js';
const { emitToUser } = socketHandler;

// FIX 2: Normalize role to lowercase before comparing
const canUserMessageRecipient = async (senderId, recipientId, senderRole) => {
  // const User = require('../models/User');
  const recipient = await User.findById(recipientId);
  if (!recipient) return false;
  const role = senderRole?.toLowerCase();
  if (role === 'admin' || role === 'organiser') return true;
  if (role === 'booker') {
    const recipientRole = recipient.role?.toLowerCase();
    return recipientRole === 'admin' || recipientRole === 'organiser';
  }
  return false;
};

router.get('/conversations', protect, async (req, res) => {
  try {
    const userRole = req.user.role?.toLowerCase();
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const query = {
      participants: { $in: [userObjectId] },
      isDeleted: false,
      deletedBy: { $ne: userObjectId }
    };

    let conversations = await Conversation.find(query)
      .populate('participants', 'name avatar email role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    console.log(`Found ${conversations.length} conversations for user ${userId}`);

    let formatted = conversations.map(conv => {
      // CRITICAL FIX: Ensure we're comparing IDs correctly
      const other = conv.participants.find(p => {
        const participantId = p?._id?.toString() || p?.toString();
        return participantId !== userId;
      });

      if (!other) {
        console.warn(`Conversation ${conv._id} has no other participant for user ${userId}`);
        return null;
      }

      const otherRole = other?.role?.toLowerCase?.() || 'booker';
      
      // Get the last message text
      let lastMessageText = 'No messages yet';
      if (conv.lastMessage) {
        lastMessageText = conv.lastMessage.text?.substring(0, 50) || 'No messages yet';
      } else if (conv.messages && conv.messages.length > 0) {
        const lastMsg = conv.messages[conv.messages.length - 1];
        lastMessageText = lastMsg.text?.substring(0, 50) || 'No messages yet';
      }

      // FIX: Ensure we're sending the correct avatar URL
      const avatarUrl = other?.avatar 
        ? `${process.env.VITE_BASE_URL || ''}${other.avatar}` 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'User')}&background=6366f1&color=fff&bold=true`;

      return {
        id: conv._id,
        _id: conv._id,
        // IMPORTANT: This should be the OTHER participant's name
        name: other?.name || 'Unknown User',
        participantRole: otherRole,
        participantId: other?._id || other,
        participantEmail: other?.email,
        subject: conv.subject || 'Conversation',
        preview: lastMessageText,
        time: conv.updatedAt,
        unread: false, // You might want to calculate this based on read receipts
        starred: false, // You might want to store this in a user-specific field
        avatar: avatarUrl,
        messages: [],
        // Add participants array for frontend to use if needed
        participants: conv.participants.map(p => ({
          _id: p._id,
          name: p.name,
          avatar: p.avatar,
          role: p.role
        }))
      };
    }).filter(conv => conv !== null);


    formatted = formatted.map(conv => {
      const canStartNew = userRole === 'booker'
        ? ['admin', 'organiser'].includes(conv.participantRole)
        : true;

      return {
        ...conv,
        canReply: true,
        canStartNew: canStartNew
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id,
      isDeleted: false
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversationId: req.params.id,
      isDeleted: false,
      sender: { $in: conversation.participants }
    })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const formatted = messages.map(msg => {
      const isRead = msg.readBy.some(id => id.toString() === req.user.id.toString());
      return {
        id: msg._id,
        text: msg.text,
        sender: msg.sender._id.toString(),
        senderName: msg.sender.name,
        senderRole: msg.sender.role?.toLowerCase?.() || 'booker',
        time: msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: isRead ? 'read' : 'sent'
      };
    });

    await Message.updateMany(
      { conversationId: req.params.id, readBy: { $ne: userObjectId } },
      { $addToSet: { readBy: userObjectId } }
    );

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/conversations', protect, async (req, res) => {
  try {
    const { recipientId, subject, firstMessage } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const canMessage = await canUserMessageRecipient(userId, recipientId, userRole);
    if (!canMessage) {
      return res.status(403).json({
        error: 'You are not allowed to message this user. Bookers can only message admins and organisers.'
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

    let conversation = await Conversation.findOne({
      participants: { $all: [userObjectId, recipientObjectId] },
      isDeleted: false
    }).populate('participants', 'name avatar email role');

    if (!conversation) {
      conversation = new Conversation({
        participants: [userObjectId, recipientObjectId],
        subject: subject || `Conversation between ${req.user.name} and ${recipient.name}`
      });
      await conversation.save();
      await conversation.populate('participants', 'name avatar email role');
    }

    if (firstMessage) {
      const message = new Message({
        conversationId: conversation._id,
        sender: userId,
        text: firstMessage,
        readBy: [userId]
      });
      await message.save();

      conversation.lastMessage = message._id;
      conversation.lastMessageText = firstMessage;
      await conversation.save();

      const messageData = {
        id: message._id,
        conversationId: conversation._id,
        text: message.text,
        sender: userId,
        senderName: req.user.name,
        senderRole: userRole?.toLowerCase(),
        time: message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };

      // FIX 1: emit 'chat:new_message' — matches frontend socketService listener
      emitToUser(recipientId, 'chat:new_message', messageData);
    }

    const other = conversation.participants.find(p => p._id.toString() !== userId);
    res.status(201).json({
      id: conversation._id,
      _id: conversation._id,
      name: other?.name || 'Unknown',
      participantRole: other?.role?.toLowerCase?.() || 'booker',
      subject: conversation.subject,
      preview: firstMessage || '',
      time: conversation.updatedAt,
      unread: false,
      starred: false,
      avatar:
        other?.avatar ||
        other?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ||
        'UN',
      messages: []
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { text, attachments } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId,
      isDeleted: false
    }).populate('participants', 'name email role');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const recipient = conversation.participants.find(p => p._id.toString() !== userId);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found in conversation' });
    }

    const message = new Message({
      conversationId: conversation._id,
      sender: userId,
      text,
      attachments: attachments || [],
      readBy: [userId]
    });
    await message.save();

    conversation.lastMessage = message._id;
    conversation.lastMessageText = text;
    await conversation.save();

    const messageData = {
      id: message._id,
      conversationId: conversation._id,
      text: message.text,
      sender: userId,
      senderName: req.user.name,
      senderRole: userRole?.toLowerCase(),
      time: message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      createdAt: message.createdAt
    };

    const recipientId = recipient._id.toString();
    // FIX 1: emit 'chat:new_message' — matches frontend socketService listener
    emitToUser(recipientId, 'chat:new_message', messageData);

    res.status(201).json(messageData);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.put('/conversations/:id/read', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    await Message.updateMany(
      {
        conversationId: req.params.id,
        readBy: { $ne: userObjectId },
        sender: { $ne: userObjectId }
      },
      { $addToSet: { readBy: userObjectId } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.get('/users/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    const userRole = req.user.role;

    let userQuery = {
      name: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id },
      status: 'active'
    };

    if (userRole?.toLowerCase() === 'booker') {
      userQuery.role = { $in: ['admin', 'organiser'] };
    }

    const users = await User.find(userQuery)
      .select('name email avatar role')
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.get('/available-recipients', protect, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = {
      _id: { $ne: userId },
      status: 'active'
    };

    if (userRole?.toLowerCase() === 'booker') {
      query.role = { $in: ['admin', 'organiser'] };
    }

    const users = await User.find(query)
      .select('name email avatar role')
      .sort('name');

    res.json(users);
  } catch (error) {
    console.error('Error fetching available recipients:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
});

export default router;