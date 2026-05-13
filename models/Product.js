const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStock: {
    type: Number,
    min: 0,
    default: 5 // Low stock threshold
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true // Allow null values but unique if present
  },
  category: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.cost === 0) return 0;
  return ((this.price - this.cost) / this.cost) * 100;
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStock;
});

module.exports = mongoose.model('Product', productSchema);