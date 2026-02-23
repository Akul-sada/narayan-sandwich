const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'sandwiches',
      'grilled sandwiches',
      'jam sandwich',
      'sweet bites',
      'panini',
      'roll',
      'franky',
      'bhel',
      'burger',
      'pizza',
      'beverages',
      'desserts',
      'starters'
    ]
  },
  subCategory: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  originalPrice: {
    type: Number
  },
  imageUrl: {
    type: String,
    default: ''
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  tags: [{
    type: String,
    trim: true
  }],
  customizationOptions: [{
    name: String,
    options: [String],
    additionalPrice: Number
  }],
  popularity: {
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

// Indexes for faster queries
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
