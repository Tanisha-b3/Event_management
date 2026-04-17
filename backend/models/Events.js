import mongoose from 'mongoose';
const ticketTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  available: { type: Number, min: 0 }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true},
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['Music', 'Conference', 'Workshop', 'Meetup', 'Festival', 'Business', 'Holiday', 'Technology', 'Food', 'Sports', 'Entertainment', 'Education', 'Art', 'Health', 'Gaming', 'Literature', 'Fundraiser'], required: true },
  attendees: { type: Number, default: 0, min: 0 },
  ticketsSold: { type: Number, default: 0, min: 0 },
  capacity: { type: Number, default: 100, min: 1 },
  revenue: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'cancelled', 'completed', 'soldout', 'upcoming', 'pending'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  ticketPrice: { type: Number, default: 0, min: 0 },
  image: { type: String },
  organizer: { type: String, default: 'Event Organizer' },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  time: { type: String, default: '10:00 AM - 5:00 PM' },
  imageName: { type: String },
  views: { type: Number, default: 0 },
  ticketTypes: [ticketTypeSchema]
});

export default mongoose.model('Event', eventSchema);
