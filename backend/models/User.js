
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'booker', 'organiser'], default: 'booker' },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, maxlength: 300, default: '' },
  status: { type: String, enum: ['active', 'inactive', 'banned', 'pending'], default: 'pending' },
  isDeleted: { type: Boolean, default: false },
  privacy: {
    showEmail: { type: Boolean, default: false },
    showProfile: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: false }
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    ticketBooked: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    orderUpdates: { type: Boolean, default: true }
  },
  otp: {
    code: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    method: { type: String, enum: ['email', 'phone'], default: 'email' },
    isVerified: { type: Boolean, default: false }
  },
  tempLoginToken: {
    token: { type: String, default: '' },
    expiresAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


// Generate JWT token
userSchema.methods.getJWTToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Soft delete
userSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.status = 'inactive';
  await this.save();
};

export default mongoose.model('User', userSchema);
