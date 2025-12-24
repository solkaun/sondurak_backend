const mongoose = require('mongoose');

const customerVehicleSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  plate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerVehicle', customerVehicleSchema);

