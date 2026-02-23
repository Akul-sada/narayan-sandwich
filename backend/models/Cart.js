const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  customization: {
    type: Map,
    of: String,
    default: {}
  },
  specialInstructions: {
    type: String,
    default: ''
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', async function(next) {
  await this.calculateTotals();
  next();
});

// Instance method to calculate totals
cartSchema.methods.calculateTotals = async function() {
  // Calculate item total
  let itemTotal = 0;
  let totalItems = 0;
  
  this.items.forEach(item => {
    itemTotal += item.price * item.quantity;
    totalItems += item.quantity;
  });
  
  this.totalAmount = itemTotal;
  this.totalItems = totalItems;
  
  // Calculate tax (assuming 5% GST)
  this.taxAmount = this.totalAmount * 0.05;
  
  // Calculate delivery charge (free above 200)
  this.deliveryCharge = this.totalAmount > 200 ? 0 : 20;
  
  // Calculate grand total
  this.grandTotal = this.totalAmount + this.taxAmount + this.deliveryCharge - this.discount;
  
  this.lastUpdated = new Date();
};

// Add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1, customization = {}, instructions = '') {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (!product.isAvailable) {
    throw new Error('Product is not available');
  }
  
  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString() && 
    JSON.stringify(item.customization) === JSON.stringify(customization)
  );
  
  if (existingItemIndex > -1) {
    // Update quantity of existing item
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      price: product.price,
      name: product.name,
      customization,
      specialInstructions: instructions
    });
  }
  
  await this.calculateTotals();
  return this;
};

// Remove item from cart
cartSchema.methods.removeItem = async function(productId, quantity = 1, customization = {}) {
  const itemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString() && 
    JSON.stringify(item.customization) === JSON.stringify(customization)
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  if (this.items[itemIndex].quantity <= quantity) {
    // Remove item completely
    this.items.splice(itemIndex, 1);
  } else {
    // Reduce quantity
    this.items[itemIndex].quantity -= quantity;
  }
  
  await this.calculateTotals();
  return this;
};

// Clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.totalAmount = 0;
  this.totalItems = 0;
  this.taxAmount = 0;
  this.deliveryCharge = 0;
  this.discount = 0;
  this.grandTotal = 0;
  this.lastUpdated = new Date();
  
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);