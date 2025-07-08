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
  status: { type: String, enum: ['active', 'cancelled', 'completed', 'soldout'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  ticketPrice:{type:Number, default:0,min:1},
  image:{type: String}
});

module.exports = mongoose.model('Event', eventSchema);
