const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerVehicle',
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  plate: {
    type: String,
    trim: true,
    uppercase: true
  },
  currentKm: {
    type: Number,
    min: 0
  },
  currentIssues: {
    type: String,
    trim: true
  },
  isOilChange: {
    type: Boolean,
    default: false
  },
  nextOilChangeKm: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  parts: [{
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  laborCost: {
    type: Number,
    required: true,
    min: 0
  },
  partsCost: {
    type: Number,
    required: true,
    default: 0
  },
  totalCost: {
    type: Number,
    required: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Repair', repairSchema);

