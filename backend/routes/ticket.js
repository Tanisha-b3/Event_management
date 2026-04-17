import express from 'express';

const router = express.Router();

import Ticket from '../models/Ticket.js';
import Event from '../models/Events.js';
import Notification from '../models/Notification.js';

import authMiddleware from '../middleware/Auth.js';
import socketHandler from '../socketHandler.js';
const { auth, authorizeRoles } = authMiddleware;
const { emitToUser } = socketHandler;

// --- EMAIL CONTROLLER ---
import { sendEmail } from '../controllers/email.js';
// --- END EMAIL CONTROLLER ---

// Admin: Get all tickets (for any event)
// Organiser: Get only tickets for their events
router.get('/admin/all', auth, authorizeRoles('organiser', 'admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const eventId = req.query.eventId;
    
    // Check user role
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;
    
    let query = {};
    
    if (!isAdmin) {
      // For organiser, only get events they organised
      const organizerEvents = await Event.find({ 
        $or: [
          { organizerId: userId },
          { createdBy: userId }
        ]
      }).select('_id');
      
      const eventIds = organizerEvents.map(e => e._id);
      
      if (eventIds.length === 0) {
        return res.json({
          success: true,
          tickets: [],
          pagination: { page: 1, limit, total: 0, pages: 0 }
        });
      }
      
      query = { eventId: { $in: eventIds } };
    }
    
    if (eventId) {
      query = { ...query, eventId };
    }
    
    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      Ticket.countDocuments(query)
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin/Organiser: Get tickets for a specific event
router.get('/event/:eventId', auth, authorizeRoles('organiser', 'admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { eventId, isCancelled: { $ne: true } };
    
    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      Ticket.countDocuments(query)
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin/Organiser: Book ticket on behalf of user
router.post('/admin/book', auth, authorizeRoles('organiser', 'admin'), async (req, res) => {
  try {
    const { userId, eventId, eventName, eventDate, eventLocation, ticketType, quantity, price } = req.body;
    const qty = Number(quantity);

    if (!userId || !eventId || !qty || Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, error: 'userId, eventId and a valid quantity are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Validate price against event price (admin can override but with limit)
    const ticketPrice = Number(price ?? event.ticketPrice ?? 0);
    const maxAllowedPrice = event.ticketPrice * 1.5; // Max 50% above event price
    
    if (ticketPrice > maxAllowedPrice && req.user.role !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        error: `Price cannot exceed ${maxAllowedPrice} for organizers` 
      });
    }

    const currentSold = event.ticketsSold || 0;
    const currentAttendees = event.attendees || 0;
    const currentRevenue = event.revenue || 0;
    const totalRequested = currentSold + qty;

    if (event.capacity && totalRequested > event.capacity) {
      return res.status(400).json({ success: false, error: 'Not enough capacity for requested tickets' });
    }

    const bookingId = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const ticket = await Ticket.create({
      bookingId,
      userId,
      userEmail: req.body.userEmail || 'admin@booked.com',
      userName: req.body.userName || 'Admin Booked',
      eventId,
      eventName: eventName || event.title,
      eventDate: eventDate || event.date,
      eventLocation: eventLocation || event.location,
      ticketType: ticketType || 'General Admission',
      quantity: qty,
      price: ticketPrice,
      bookedBy: req.user.id,
      bookedByName: req.user.name
    });

    event.ticketsSold = totalRequested;
    event.attendees = currentAttendees + qty;
    event.revenue = currentRevenue + (ticketPrice * qty);
    await event.save();

    await createTicketNotification(
      userId,
      'ticket_booked',
      'Ticket Booked for You! 🎉',
      `You've been booked ${qty} ticket(s) for ${eventName || event.title} by admin`,
      { eventId, ticketId: ticket._id, link: `/my-tickets` }
    );

    // Send ticket confirmation email
    try {
      await sendEmail({
        body: {
          to: req.user.email,
          subject: `Your Ticket for ${eventName || event.title}`,
          template: 'ticket_purchase',
          templateData: {
            userName: req.user.name || req.user.email,
            eventName: eventName || event.title,
            eventDate: eventDate || event.date,
            eventLocation: eventLocation || event.location,
            ticketType: ticketType || 'General Admission',
            quantity: qty,
            bookingId,
            price: ticketPrice
          }
        }
      }, { json: () => {} });
    } catch (e) {
      console.error('Ticket email error:', e);
    }

    res.status(201).json({ success: true, ticket, event });
  } catch (err) {
    console.error('Admin ticket booking error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Helper to create notification
const createTicketNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data
    });
    await notification.save();
    emitToUser(userId, 'notification:new', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get all tickets for authenticated user (non-cancelled, paginated)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id, isCancelled: { $ne: true } };
    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query)
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new ticket and update event metrics
router.post('/', auth, authorizeRoles('booker', 'organiser', 'admin'), async (req, res) => {
  try {
    const { eventId, eventName, eventDate, eventLocation, ticketType, quantity, price } = req.body;
    const qty = Number(quantity);

    if (!eventId || !qty || Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, error: 'eventId and a valid quantity are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const ticketPrice = Number(price ?? event.ticketPrice ?? 0);
    const currentSold = event.ticketsSold || 0;
    const currentAttendees = event.attendees || 0;
    const currentRevenue = event.revenue || 0;
    const totalRequested = currentSold + qty;

    if (event.capacity && totalRequested > event.capacity) {
      return res.status(400).json({ success: false, error: 'Not enough capacity for requested tickets' });
    }

    const bookingId = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const ticket = await Ticket.create({
      bookingId,
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      eventId,
      eventName: eventName || event.title,
      eventDate: eventDate || event.date,
      eventLocation: eventLocation || event.location,
      ticketType: ticketType || 'General Admission',
      quantity: qty,
      price: ticketPrice
    });

    // Update event counters
    event.ticketsSold = totalRequested;
    event.attendees = currentAttendees + qty;
    event.revenue = currentRevenue + (ticketPrice * qty);
    await event.save();

    // Send notification to user
    await createTicketNotification(
      req.user.id,
      'ticket_booked',
      'Ticket Booked Successfully! 🎉',
      `You've booked ${qty} ticket(s) for ${eventName || event.title}`,
      { eventId, ticketId: ticket._id, link: `/my-tickets` }
    );

     try {
      await sendEmail({
        body: {
          to: req.user.email,
          subject: `Your Ticket for ${eventName || event.title}`,
          template: 'ticket_purchase',
          templateData: {
            userName: req.user.name || req.user.email,
            eventName: eventName || event.title,
            eventDate: eventDate || event.date,
            eventLocation: eventLocation || event.location,
            ticketType: ticketType || 'General Admission',
            quantity: qty,
            bookingId,
            price: ticketPrice
          }
        }
      }, { json: () => {} });
    } catch (e) {
      console.error('Ticket email error:', e);
    }

    res.status(201).json({ success: true, ticket, event });
  } catch (err) {
    console.error('Ticket booking error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cancel (soft delete) a ticket
router.delete('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id, isCancelled: { $ne: true } });

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    ticket.isCancelled = true;
    ticket.cancelledAt = new Date();
    await ticket.save();

    // Roll back event counters if the event still exists
    const event = await Event.findById(ticket.eventId);
    if (event) {
      const qty = ticket.quantity || 0;
      const ticketTotal = (ticket.price || 0) * qty;

      event.ticketsSold = Math.max(0, (event.ticketsSold || 0) - qty);
      event.attendees = Math.max(0, (event.attendees || 0) - qty);
      event.revenue = Math.max(0, (event.revenue || 0) - ticketTotal);
      await event.save();
    }

    // Send notification to user about ticket cancellation
    await createTicketNotification(
      req.user.id,
      'ticket_cancelled',
      'Ticket Cancelled ❌',
      `Your ticket for ${ticket.eventName} has been cancelled`,
      { eventId: ticket.eventId, ticketId: ticket._id, link: `/my-tickets` }
    );

    res.json({ success: true, message: 'Ticket cancelled successfully', ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin/Organiser: Cancel any ticket (with reason)
router.delete('/admin/:id', auth, authorizeRoles('organiser', 'admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, isCancelled: { $ne: true } });
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    ticket.isCancelled = true;
    ticket.cancelledAt = new Date();
    await ticket.save();

    // Roll back event counters if the event still exists
    const event = await Event.findById(ticket.eventId);
    if (event) {
      const qty = ticket.quantity || 0;
      const ticketTotal = (ticket.price || 0) * qty;
      event.ticketsSold = Math.max(0, (event.ticketsSold || 0) - qty);
      event.attendees = Math.max(0, (event.attendees || 0) - qty);
      event.revenue = Math.max(0, (event.revenue || 0) - ticketTotal);
      await event.save();
    }

    // Send notification to user about ticket cancellation with reason
    const reason = req.body.reason || 'No reason provided.';
    await createTicketNotification(
      ticket.userId,
      'ticket_cancelled',
      'Ticket Cancelled by Admin/Organiser',
      `Your ticket for ${ticket.eventName} has been cancelled. Reason: ${reason}`,
      { eventId: ticket.eventId, ticketId: ticket._id, link: '/my-tickets', reason }
    );

    // (Optional) TODO: Send email to ticket.userEmail with the reason

    res.json({ success: true, message: 'Ticket cancelled and user notified', ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
