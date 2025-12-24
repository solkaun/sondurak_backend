const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');
const { protect, adminOnly } = require('../middleware/auth');

// Get all repairs (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const repairs = await Repair.find()
      .populate('parts.part', 'name')
      .populate('customerVehicle', 'customerName customerPhone brand model plate')
      .sort({ date: -1 });
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Create repair (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { date, customerVehicle, brand, model, plate, currentKm, currentIssues, description, parts, laborCost } = req.body;

    // Parça maliyetini hesapla
    let partsCost = 0;
    if (parts && parts.length > 0) {
      partsCost = parts.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }

    const totalCost = laborCost + partsCost;

    const repair = await Repair.create({
      date: date || Date.now(),
      customerVehicle: customerVehicle || null,
      brand,
      model,
      plate: plate.toUpperCase(),
      currentKm: currentKm || null,
      currentIssues: currentIssues || null,
      description,
      parts: parts || [],
      laborCost,
      partsCost,
      totalCost
    });

    const populatedRepair = await Repair.findById(repair._id)
      .populate('parts.part', 'name')
      .populate('customerVehicle', 'customerName customerPhone brand model plate');

    res.status(201).json(populatedRepair);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Update repair (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { date, customerVehicle, brand, model, plate, currentKm, currentIssues, description, parts, laborCost } = req.body;

    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ message: 'Tamir kaydı bulunamadı' });
    }

    repair.date = date || repair.date;
    repair.customerVehicle = customerVehicle !== undefined ? customerVehicle : repair.customerVehicle;
    repair.brand = brand || repair.brand;
    repair.model = model || repair.model;
    repair.plate = plate ? plate.toUpperCase() : repair.plate;
    repair.currentKm = currentKm !== undefined ? currentKm : repair.currentKm;
    repair.currentIssues = currentIssues !== undefined ? currentIssues : repair.currentIssues;
    repair.description = description || repair.description;
    repair.parts = parts || repair.parts;
    repair.laborCost = laborCost !== undefined ? laborCost : repair.laborCost;

    // Parça maliyetini yeniden hesapla
    repair.partsCost = repair.parts.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    repair.totalCost = repair.laborCost + repair.partsCost;

    await repair.save();

    const populatedRepair = await Repair.findById(repair._id)
      .populate('parts.part', 'name')
      .populate('customerVehicle', 'customerName customerPhone brand model plate');

    res.json(populatedRepair);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Delete repair (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ message: 'Tamir kaydı bulunamadı' });
    }

    await repair.deleteOne();
    res.json({ message: 'Tamir kaydı silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;

