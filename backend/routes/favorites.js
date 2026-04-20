import express from 'express';

const router = express.Router();

import Favorite from '../models/Favorite.js';
import Event from '../models/Events.js';

import authMiddleware from '../middleware/Auth.js';
const { auth, authorizeRoles } = authMiddleware;

// Get all favorites for current user (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    const [favorites, total] = await Promise.all([
      Favorite.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('event', 'title date location category ticketPrice image imageName organizer status'),
      Favorite.countDocuments(query)
    ]);

    const normalized = favorites.map((fav) => {
      const base = fav.event || fav.eventSnapshot || {};
      const plain = base._doc ? { ...base._doc } : { ...base };
      return {
        _id: fav._id,
        eventId: fav.event?._id || fav.eventSnapshot?.eventId || fav.eventSnapshot?._id,
        createdAt: fav.createdAt,
        updatedAt: fav.updatedAt,
        ...plain,
      };
    });

    res.json({
      favorites: normalized,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Failed to fetch favorites', err);
    res.status(500).json({ message: 'Failed to load saved events' });
  }
});

// Save an event
router.post('/', auth, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const snapshot = {
      title: event.title,
      date: event.date,
      location: event.location,
      category: event.category,
      ticketPrice: event.ticketPrice,
      image: event.image,
      imageName: event.imageName,
      organizer: event.organizer,
      status: event.status,
      eventId: event._id,
    };

    const existingFavorite = await Favorite.findOne({ user: req.user.id, event: event._id });

    if (!existingFavorite) {
      await Event.findByIdAndUpdate(event._id, { $inc: { likes: 1 } });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { user: req.user.id, event: event._id },
      { event: event._id, eventSnapshot: snapshot },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('event', 'title date location category ticketPrice image imageName organizer status');

    const response = favorite.event || favorite.eventSnapshot || {};
    const plain = response.toObject ? response.toObject() : { ...response };

    res.status(201).json({ favorite: { ...plain, eventId: event._id } });
  } catch (err) {
    console.error('Failed to save favorite', err);
    res.status(500).json({ message: 'Unable to save event' });
  }
});

// Remove a favorite by event id
router.delete('/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }

    const existingFavorite = await Favorite.findOne({ user: req.user.id, event: eventId });
    if (existingFavorite) {
      await Event.findByIdAndUpdate(eventId, { $inc: { likes: -1 } });
    }

    await Favorite.findOneAndDelete({ user: req.user.id, event: eventId });
    res.json({ success: true, removed: eventId });
  } catch (err) {
    console.error('Failed to remove favorite', err);
    res.status(500).json({ message: 'Unable to remove saved event' });
  }
});

export default router;
