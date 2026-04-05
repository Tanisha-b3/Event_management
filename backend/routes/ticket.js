const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket.js');
const Event = require('../models/Events.js');
const { auth, authorizeRoles } = require('../middleware/Auth.js');

// Get all tickets for authenticated user (non-cancelled)
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id, isCancelled: { $ne: true } });
    res.json({ success: true, tickets });
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

    res.json({ success: true, message: 'Ticket cancelled successfully', ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
