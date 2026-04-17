import mongoose from 'mongoose';

import Event from '../models/Events.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

import socketHandler from '../socketHandler.js';
import { sendEmail } from './email.js';
const { emitToUser, emitToAll } = socketHandler;

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getDateStatus = (eventDate) => {
  const now = new Date();
  const eventDateObj = new Date(eventDate);
  const diffDays = Math.ceil((eventDateObj - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'near';
  return 'far';
};

// Get all events with pagination
const getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const myEvents = req.query.myEvents === 'true';
    const isAdmin = req.user?.role === 'admin';
    const isOrganiser = req.user?.role === 'organiser';
    const category = req.query.category;
    const search = req.query.search;
    const location = req.query.location;
    const filterType = req.query.filterType;

  

    let query = {};
    
    // BUILD QUERY BASED ON USER ROLE AND CONTEXT
    if (myEvents && req.user) {
      // For "My Events" - show events created by this user (organizer)
      const userId = req.user.id || req.user._id;
      query = {
        $or: [
          { organizerId: userId },
          { createdBy: userId }
        ]
      };
      // console.log('📌 Fetching MY events for organizer:', userId);
    } else if (isAdmin) {
      // Admin can see all events
      // console.log('👑 Admin fetching ALL events');
    } else if (isOrganiser) {
      // Organizer sees all events (for discovery) but can manage their own
      query.status = 'active';
      // console.log('🎪 Organizer fetching active events');
    } else if (req.user) {
      // Regular authenticated user
      query.status = 'active';
      // console.log('👤 User fetching active events');
    } else {
      // Public user
      query.status = 'active';
      // console.log('🌐 Public fetching active events');
    }
    
    // Apply category filter
    if (category && category !== 'all' && category !== '') {
      query.category = category;
    }
    
    // Apply search filter
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [
            { title: searchRegex },
            { description: searchRegex }
          ]}
        ];
        delete query.$or;
      } else {
        query.$or = [
          { title: searchRegex },
          { description: searchRegex }
        ];
      }
    }
    
    // Apply location filter
    if (location && location !== 'all' && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }
    
    // Apply date filters
    const now = new Date();
    
    if (filterType === 'upcoming') {
      query.date = { $gte: now };
    } else if (filterType === 'past') {
      query.date = { $lt: now };
    } else if (filterType === 'active') {
      query.date = { $gte: now };
    }
    
    // console.log('🔍 Final MongoDB query:', JSON.stringify(query, null, 2));

    // Execute query with pagination
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ date: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query)
    ]);

    // console.log(`✅ Found ${events.length} events out of ${total} total (Page ${page} of ${Math.ceil(total / limit)})`);

    // Get organizer names
    const organizerIds = events
      .filter(event => event.organizerId && isValidObjectId(event.organizerId))
      .map(event => event.organizerId);
    
    let organizerMap = {};
    if (organizerIds.length > 0) {
      const organizers = await User.find({ _id: { $in: organizerIds } }).select('name email').lean();
      organizers.forEach(user => {
        organizerMap[user._id.toString()] = user.name || user.email;
      });
    }

    // Format events
    const eventsWithDetails = events.map(event => {
      const eventObj = { ...event };

      // Set organizer name
      if (eventObj.organizerId && organizerMap[eventObj.organizerId.toString()]) {
        eventObj.organizer = organizerMap[eventObj.organizerId.toString()];
      } else if (!eventObj.organizer) {
        eventObj.organizer = 'Event Organizer';
      }

      // Calculate available tickets
      eventObj.availableTickets = Math.max(0, (eventObj.capacity || 0) - (eventObj.ticketsSold || 0));
      eventObj.attendees = eventObj.ticketsSold || 0;

      // Update status
      if (eventObj.availableTickets === 0 && eventObj.status === 'active') {
        eventObj.status = 'soldout';
      }

      if (eventObj.status === 'active') {
        const nowDate = new Date();
        const eventDateObj = new Date(eventObj.date);
        if (eventDateObj < nowDate) {
          eventObj.status = 'expired';
        }
      }

      return eventObj;
    });

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    // console.log('📄 Pagination response:', pagination);

    res.json({
      success: true,
      events: eventsWithDetails,
      pagination,
      filters: { category, search, location, filterType, myEvents }
    });
  } catch (err) {
    console.error('Error in getEvents:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch events',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const event = await Event.findById(id).lean();
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get organizer name
    let organizerName = event.organizer;
    if (event.organizerId && isValidObjectId(event.organizerId)) {
      const organizer = await User.findById(event.organizerId).select('name email').lean();
      if (organizer) {
        organizerName = organizer.name || organizer.email;
      }
    }

    const eventObj = {
      ...event,
      organizer: organizerName,
      availableTickets: Math.max(0, (event.capacity || 0) - (event.ticketsSold || 0)),
      attendees: event.ticketsSold || 0
    };

    res.status(200).json({
      success: true,
      event: eventObj
    });
  } catch (err) {
    console.error(`Error fetching event ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
};

export const createEvent = async (req, res) => {
  try {
    // console.log('Received event data:', req.body);
    // console.log('User creating event:', req.user);

    const requiredFields = ['title', 'date', 'location', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const isAdmin = req.user?.role === 'admin';
    
    const eventData = {
      title: req.body.title,
      date: new Date(req.body.date),
      location: req.body.location,
      description: req.body.description || '',
      category: req.body.category,
      ticketPrice: parseFloat(req.body.ticketPrice) || 0,
      capacity: parseInt(req.body.capacity) || 100,
      status: isAdmin ? (req.body.status || 'active') : 'pending',
      privacy: req.body.privacy || 'public',
      attendees: req.body.attendees || 0,
      ticketsSold: req.body.ticketsSold || 0,
      revenue: req.body.revenue || 0,
      imageName: req.body.imageName || req.body.fileName || '',
      organizer: req.user?.name || req.user?.email || 'Event Organizer',
      organizerId: req.user?.id || req.user?._id,
      createdBy: req.user?.id || req.user?._id,
      time: req.body.time || '10:00 AM - 5:00 PM'
    };

    // Validate required fields for authenticated user
    if (!eventData.organizerId) {
      return res.status(401).json({
        success: false,
        message: 'User not properly authenticated'
      });
    }

    // Ticket Types
    if (!req.body.ticketTypes || req.body.ticketTypes.length === 0) {
      eventData.ticketTypes = [
        {
          name: 'General Admission',
          price: eventData.ticketPrice || 0,
          quantity: eventData.capacity || 100
        }
      ];
    } else {
      eventData.ticketTypes = req.body.ticketTypes;
    }

    const event = new Event(eventData);
    const newEvent = await event.save();

    // Notify all admins (except the creator if admin)
    const admins = await User.find({ role: 'admin', isDeleted: false });
    for (const admin of admins) {
      if (!req.user || admin._id.toString() !== req.user.id?.toString()) {
        const notification = new Notification({
          userId: admin._id,
          type: 'new_event',
          title: 'New Event Created 📋',
          message: `Organizer "${eventData.organizer}" created "${eventData.title}". Click to review.`,
          data: { eventId: newEvent._id, link: `/admin/events` }
        });
        await notification.save();
        emitToUser(admin._id, 'notification:new', notification);
      }
    }

    // Send event confirmation email to organizer
    try {
      await sendEmail({
        body: {
          to: req.user.email,
          subject: `Your Event "${eventData.title}" is Ready!`,
          template: 'event_confirmation',
          templateData: {
            eventName: eventData.title,
            eventDate: eventData.date,
            eventLocation: eventData.location,
            price: eventData.ticketPrice,
            availableTickets: eventData.capacity - (eventData.ticketsSold || 0)
          }
        }
      }, { json: () => {} });
    } catch (emailErr) {
      console.error('Event confirmation email error:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });

  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update an event
// Update an event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle image name update
    if (req.body.fileName) {
      // If new file was uploaded
      updateData.imageName = req.body.fileName;
      // console.log('New image uploaded:', updateData.imageName);
    } else if (req.body.imageName !== undefined) {
      // If image name was provided in request body
      updateData.imageName = req.body.imageName;
    } else if (req.body.removeImage === 'true') {
      // If image should be removed
      updateData.imageName = '';
    }
    // If no image-related fields, keep existing imageName
    
    // Convert date if present
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    // Convert numeric fields
    if (updateData.ticketPrice) updateData.ticketPrice = parseFloat(updateData.ticketPrice);
    if (updateData.capacity) updateData.capacity = parseInt(updateData.capacity);
    
    // Parse ticketTypes if it's a string (from FormData)
    if (updateData.ticketTypes && typeof updateData.ticketTypes === 'string') {
      try {
        updateData.ticketTypes = JSON.parse(updateData.ticketTypes);
      } catch (e) {
        console.error('Failed to parse ticketTypes:', e);
        delete updateData.ticketTypes;
      }
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.__v;
    delete updateData.fileName; // Remove fileName if present (use imageName instead)

    const event = await Event.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (err) {
    console.error(`Error updating event ${req.params.id}:`, err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating event',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete an event
 const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const event = await Event.findByIdAndDelete(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {
        id: event._id,
        title: event.title
      }
    });
  } catch (err) {
    console.error(`Error deleting event ${req.params.id}:`, err);
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting event',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get high-level stats for organiser/admin dashboards
 const getEventStats = async (req, res) => {
  try {
    const now = new Date();

    const [ticketAgg] = await Ticket.aggregate([
      { $match: { isCancelled: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
        },
      },
    ]);

    const [capacityAgg] = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: { $ifNull: ['$capacity', 0] } },
          totalEvents: { $sum: 1 },
        },
      },
    ]);

    const registrations = ticketAgg?.totalQuantity || 0;
    const revenue = ticketAgg?.totalRevenue || 0;
    const totalCapacity = capacityAgg?.totalCapacity || 0;
    const totalEvents = capacityAgg?.totalEvents || 0;
    const upcomingEvents = await Event.countDocuments({ date: { $gte: now }, status: 'active' });

    const conversion = totalCapacity > 0 ? (registrations / totalCapacity) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        registrations,
        revenue,
        conversion: Number(conversion.toFixed(1)),
        upcomingEvents,
        totals: {
          capacity: totalCapacity,
          events: totalEvents,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching event stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// Get pending events (admin only)
 const getPendingEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      events,
      pagination: { 
        page, 
        limit, 
        total, 
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching pending events:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch pending events' });
  }
};

// Approve event (admin only)
 const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      {
        status: 'active',
        approvedBy: req.user.id || req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Notify the event creator (organiser)
    if (event.createdBy) {
      const notification = new Notification({
        userId: event.createdBy,
        type: 'event_approved',
        title: 'Event Approved! 🎉',
        message: `Great news! Your event "${event.title}" is now live and visible to everyone.`,
        data: { eventId: event._id, link: `/event/${event._id}` }
      });
      await notification.save();
      emitToUser(event.createdBy, 'notification:new', notification);
    }

    res.json({
      success: true,
      message: 'Event approved successfully',
      event
    });
  } catch (err) {
    console.error('Error approving event:', err);
    res.status(500).json({ success: false, message: 'Failed to approve event' });
  }
};

// Reject event (admin only)
 const rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        approvedBy: req.user.id || req.user._id,
        approvedAt: new Date(),
        rejectionReason: reason || 'Event rejected by admin'
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Notify the event creator (organiser)
    if (event.createdBy) {
      const notification = new Notification({
        userId: event.createdBy,
        type: 'event_rejected',
        title: 'Event Not Approved',
        message: `Your event "${event.title}" was not approved. Reason: ${event.rejectionReason || 'Please contact support'}`,
        data: { eventId: event._id, link: `/dashboard` }
      });
      await notification.save();
      emitToUser(event.createdBy, 'notification:new', notification);
    }

    res.json({
      success: true,
      message: 'Event rejected',
      event
    });
  } catch (err) {
    console.error('Error rejecting event:', err);
    res.status(500).json({ success: false, message: 'Failed to reject event' });
  }
};

export default {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById, 
  getEventStats,
  getPendingEvents,
  approveEvent,
  rejectEvent
}