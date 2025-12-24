const mongoose = require('mongoose');
const crypto = require('crypto');

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
  },
  qrCode: {
    type: String,
    unique: true,
    required: true,
    default: () => crypto.randomUUID() // Otomatik benzersiz QR kod (Node.js built-in)
  },
  lastOilChangeKm: {
    type: Number,
    min: 0,
    required: false // Son yağ bakımı km
  },
  lastOilChangeDate: {
    type: Date,
    required: false // Son yağ bakımı tarihi
  },
  oilChangeIntervalKm: {
    type: Number,
    default: 10000, // Varsayılan yağ bakım aralığı (km)
    min: 1000
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerVehicle', customerVehicleSchema);

