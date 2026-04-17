import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventLocation: {
    type: String,
    default: ''
  },
  eventImage: {
    type: String,
    default: ''
  },
  ticketType: {
    type: String,
    default: 'General Admission'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total before saving
cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.updatedAt = Date.now();
  next();
});

// Static method to get or create cart
cartSchema.statics.getOrCreate = async function(userId) {
  let cart = await this.findOne({ userId });
  if (!cart) {
    cart = new this({ userId, items: [] });
    await cart.save();
  }
  return cart;
};

// Method to add item to cart
cartSchema.methods.addItem = async function(itemData) {
  const existingIndex = this.items.findIndex(
    item => item.eventId.toString() === itemData.eventId && 
            item.ticketType === itemData.ticketType
  );

  if (existingIndex > -1) {
    this.items[existingIndex].quantity += itemData.quantity || 1;
  } else {
    this.items.push({
      eventId: itemData.eventId,
      eventName: itemData.eventName,
      eventDate: itemData.eventDate,
      eventLocation: itemData.eventLocation,
      eventImage: itemData.eventImage,
      ticketType: itemData.ticketType || 'General Admission',
      price: itemData.price,
      quantity: itemData.quantity || 1
    });
  }

  await this.save();
  return this;
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId);
  await this.save();
  return this;
};

// Method to update item quantity
cartSchema.methods.updateQuantity = async function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    await this.save();
  }
  return this;
};

// Method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  await this.save();
  return this;
};

export default mongoose.model('Cart', cartSchema);