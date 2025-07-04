const mongoose = require('mongoose');
const Event = require('../models/Events.js');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Get all events

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      status: req.body.status || 'active',
      attendees: req.body.attendees || 0,
      ticketsSold: req.body.ticketsSold || 0,
      revenue: req.body.revenue || 0,
      capacity: req.body.capacity || 100,
      privacy: req.body.privacy || 'public',
      ticketTypes: req.body.ticketTypes || [
        { 
          type: 'General Admission', 
          price: 50, 
          sold: 0, 
          total: 100,
          _id: new mongoose.Types.ObjectId() // Add ID for each ticket type
        }
      ]
    });

    const newEvent = await event.save();
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (err) {
    console.error('Error creating event:', err);
    
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
      message: 'Server error while creating event',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      req.body,
      { 
        new: true,
        runValidators: true // Ensures update validates against schema
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
exports.deleteEvent = async (req, res) => {
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