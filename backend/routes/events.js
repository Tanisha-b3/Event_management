const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const eventController = require('../controllers/events.js');
const { auth, authorizeRoles } = require('../middleware/Auth.js');
const Ticket = require('../models/Ticket.js');
const Event = require('../models/Events.js');
const upload = require('../middleware/upload.js');


router.get('/', auth, eventController.getEvents);
router.get('/pending', auth, authorizeRoles('admin'), eventController.getPendingEvents);
router.get('/stats/overview', auth, authorizeRoles('admin', 'organiser'), eventController.getEventStats);
router.get('/:id', eventController.getEventById);
router.put('/:id/approve', auth, authorizeRoles('admin'), eventController.approveEvent);
router.put('/:id/reject', auth, authorizeRoles('admin'), eventController.rejectEvent);

// Attendees derived from tickets for the event
router.get('/:id/attendees', auth, authorizeRoles('admin', 'organiser'), async (req, res) => {
  try {
    const { id } = req.params;
    const tickets = await Ticket.find({ eventId: id, isCancelled: { $ne: true } });
    res.json({ success: true, attendees: tickets });
  } catch (err) {
    console.error('Error fetching attendees:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch attendees' });
  }
});

router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const tickets = await Ticket.find({ 
      $or: [
        { eventId: id },
        { eventId: new mongoose.Types.ObjectId(id) }
      ],
      createdAt: { $gte: startDate }
    });

    const cancelledTickets = tickets.filter(t => t.isCancelled);
    const validTickets = tickets.filter(t => !t.isCancelled);
    
    const totalTickets = event.capacity || 0;
    const soldTickets = validTickets.length;
    const revenue = validTickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
    
    let ticketsByType;
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      ticketsByType = event.ticketTypes.map(type => {
        const typeTickets = validTickets.filter(t => t.ticketType === type.name);
        return {
          type: type.name,
          sold: typeTickets.reduce((sum, t) => sum + t.quantity, 0),
          total: type.quantity || 0
        };
      });
    } else {
      ticketsByType = [{
        type: 'General',
        sold: soldTickets,
        total: totalTickets
      }];
    }

    res.json({
      success: true,
      totalTickets,
      soldTickets,
      revenue,
      views: event.views || 0,
      attendees: soldTickets,
      ticketsByType,
      salesByDate: []
    });
  } catch (err) {
    console.error('Error fetching analytics:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics: ' + err.message });
  }
});

router.post('/', auth, authorizeRoles('admin', 'organiser'), eventController.createEvent);

router.post(
  '/upload-image',
  auth,
  authorizeRoles('admin', 'organiser'),
  upload.single('image'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/events/${req.file.filename}`;

      res.json({
        success: true,
        imageUrl,
        fileName: req.file.filename   // ✅ send filename
      });

    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
    }
  }
);


router.put('/:id', auth, authorizeRoles('admin', 'organiser'), eventController.updateEvent);

router.delete('/:id', auth, authorizeRoles('admin', 'organiser'), eventController.deleteEvent);

module.exports = router;
