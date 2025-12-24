const express = require('express');
const router = express.Router();
const CustomerVehicle = require('../models/CustomerVehicle');
const { protect, adminOnly } = require('../middleware/auth');

// Get all customer vehicles (Admin ve User)
router.get('/', protect, async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = search ? {
      $or: [
        { customerName: { $regex: search, $options: 'i' } },
        { plate: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    const vehicles = await CustomerVehicle.find(query).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Get single customer vehicle by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Araç bulunamadı' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Get vehicle history (repairs) by vehicle ID
router.get('/:id/history', protect, async (req, res) => {
  try {
    const Repair = require('../models/Repair');
    
    const vehicle = await CustomerVehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Araç bulunamadı' });
    }

    // Araç ID'sine göre tamir kayıtlarını bul
    const repairs = await Repair.find({ customerVehicle: req.params.id })
      .populate('parts.part', 'name')
      .sort({ date: -1 });

    res.json({
      vehicle,
      repairs,
      totalRepairs: repairs.length,
      totalCost: repairs.reduce((sum, r) => sum + r.totalCost, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Create customer vehicle (Admin ve User)
router.post('/', protect, async (req, res) => {
  try {
    const { customerName, customerPhone, brand, model, plate, year, notes } = req.body;

    // Plaka kontrolü
    const existingVehicle = await CustomerVehicle.findOne({ plate: plate.toUpperCase() });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Bu plaka zaten kayıtlı' });
    }

    const vehicle = await CustomerVehicle.create({
      customerName,
      customerPhone,
      brand,
      model,
      plate: plate.toUpperCase(),
      year,
      notes
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Update customer vehicle (Sadece Admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { customerName, customerPhone, brand, model, plate, year, notes } = req.body;

    const vehicle = await CustomerVehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Araç bulunamadı' });
    }

    // Plaka değişiyorsa kontrol et
    if (plate && plate.toUpperCase() !== vehicle.plate) {
      const existingVehicle = await CustomerVehicle.findOne({ plate: plate.toUpperCase() });
      if (existingVehicle) {
        return res.status(400).json({ message: 'Bu plaka zaten kayıtlı' });
      }
    }

    vehicle.customerName = customerName || vehicle.customerName;
    vehicle.customerPhone = customerPhone || vehicle.customerPhone;
    vehicle.brand = brand || vehicle.brand;
    vehicle.model = model || vehicle.model;
    vehicle.plate = plate ? plate.toUpperCase() : vehicle.plate;
    vehicle.year = year !== undefined ? year : vehicle.year;
    vehicle.notes = notes !== undefined ? notes : vehicle.notes;

    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Delete customer vehicle (Sadece Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Araç bulunamadı' });
    }

    await vehicle.deleteOne();
    res.json({ message: 'Araç silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;

