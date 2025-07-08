const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket.js');
const auth = require('../middleware/Auth.js');

// Get all tickets for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id });
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new ticket
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, eventName, eventDate, eventLocation, ticketType, quantity, price } = req.body;

    const bookingId = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const ticket = await Ticket.create({
      bookingId,
      userId: req.user.id,
      eventId,
      eventName,
      eventDate,
      eventLocation,
      ticketType,
      quantity,
      price
    });

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cancel a ticket
router.delete('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({ success: true, message: 'Ticket cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
