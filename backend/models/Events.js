const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true},
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['Music', 'Conference', 'Workshop', 'Meetup', 'Festival','Business','Holiday','Technology','Food'], required: true },
  attendees: { type: Number, default: 0, min: 0 },
  ticketsSold: { type: Number, default: 0, min: 0 },
  capacity: { type: Number, default: 100, min: 1 },
  revenue: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'cancelled', 'completed', 'soldout', 'upcoming'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  ticketPrice: { type: Number, default: 0, min: 0 },
  image: { type: String },
  organizer: { type: String, default: 'Event Organizer' },
  time: { type: String, default: '10:00 AM - 5:00 PM' }
});

module.exports = mongoose.model('Event', eventSchema);
