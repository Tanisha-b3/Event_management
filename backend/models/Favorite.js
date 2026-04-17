const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventSnapshot: {
      title: String,
      date: Date,
      location: String,
      category: String,
      ticketPrice: Number,
      image: String,
      imageName: String,
      organizer: String,
      status: String,
    },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
