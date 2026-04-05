const express = require('express');
const router = express.Router();
const eventController = require('../controllers/events.js');
const { auth, authorizeRoles } = require('../middleware/Auth.js');
const Ticket = require('../models/Ticket.js');


router.get('/', eventController.getEvents);

router.get('/:id', eventController.getEventById);

// Attendees derived from tickets for the event
router.get('/:id/attendees', auth, authorizeRoles('admin', 'organiser'), async (req, res) => {
  try {
    const { id } = req.params;
    const tickets = await Ticket.find({ eventId: id });
    res.json({ success: true, attendees: tickets });
  } catch (err) {
    console.error('Error fetching attendees:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch attendees' });
  }
});

router.post('/', auth, authorizeRoles('admin', 'organiser'), eventController.createEvent);


router.put('/:id', auth, authorizeRoles('admin', 'organiser'), eventController.updateEvent);

router.delete('/:id', auth, authorizeRoles('admin', 'organiser'), eventController.deleteEvent);

module.exports = router;
