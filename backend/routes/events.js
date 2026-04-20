import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

import eventController from '../controllers/events.js';

import Ticket from '../models/Ticket.js';
import Event from '../models/Events.js';
import upload from '../middleware/upload.js';
import authMiddleware from '../middleware/Auth.js';
const { auth, authorizeRoles } = authMiddleware;




router.get('/', auth, eventController.getEvents);

router.get('/featured', async (req, res) => {
  try {
    const { limit = 6, category } = req.query;
    
    let query = {};
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Get events with filters, sorted by date (upcoming first)
    const events = await Event.find(query)
      .select('title description date location category ticketPrice imageName imageUrl status attendees capacity createdAt')
      .sort({ date: 1, createdAt: -1 }) // Upcoming events first, then newest
      .limit(parseInt(limit))
      .lean();
    
    // Format events for landing page
    const formattedEvents = events.map(event => ({
      _id: event._id,
      title: event.title,
      description: event.description?.substring(0, 150) + (event.description?.length > 150 ? '...' : ''),
      date: event.date,
      location: event.location,
      category: event.category,
      ticketPrice: event.ticketPrice,
      image: event.image || event.imageName ? `/uploads/events/${event.imageName || event.imageUrl}` : null,
      status: event.status,
      attendees: event.attendees || 0,
      capacity: event.capacity || 0,
      availableSeats: Math.max(0, (event.capacity || 0) - (event.attendees || 0))
    }));
    
    res.json({
      success: true,
      events: formattedEvents,
      total: events.length
    });
  } catch (err) {
    console.error('Error fetching featured events:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch featured events' 
    });
  }
});

router.get('/trending', eventController.getTrendingEvents);
router.get('/search', eventController.searchEvents);
router.get('/recommendations', eventController.getRecommendations);
router.post('/ai/describe', auth, authorizeRoles('admin', 'organiser'), eventController.generateDescription);
router.get('/dashboard', auth, authorizeRoles('organiser', 'admin'), eventController.getOrganizerDashboard);
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

router.post('/:id/notify', auth, authorizeRoles('admin', 'organiser'), async (req, res) => {
  try {
    const { id } = req.params;
    const { message, recipientType } = req.body;

    const event = await Event.findById(id).populate('attendees');
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const tickets = await Ticket.find({ eventId: id, isCancelled: { $ne: true } });
    let recipients = tickets;

    if (recipientType === 'checked-in') {
      recipients = tickets.filter(t => t.checkedIn);
    } else if (recipientType === 'not-checked-in') {
      recipients = tickets.filter(t => !t.checkedIn);
    }

    res.json({ success: true, message: `Notification queued for ${recipients.length} attendees` });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
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

export default router;
