import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userAvatar: { type: String },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userAvatar: { type: String },
  content: { type: String, required: true },
  isThread: { type: Boolean, default: false },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion' },
  replies: [replySchema],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const discussionSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userAvatar: { type: String },
  title: { type: String },
  content: { type: String, required: true },
  type: { type: String, enum: ['question', 'announcement', 'general', 'review'], default: 'general' },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  comments: [commentSchema],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

discussionSchema.index({ event: 1, createdAt: -1 });
discussionSchema.index({ event: 1, likes: -1 });
discussionSchema.index({ user: 1 });

export default mongoose.model('Discussion', discussionSchema);