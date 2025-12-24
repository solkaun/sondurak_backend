const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Part = require('../models/Part');
const { protect, adminOnly } = require('../middleware/auth');

// Get all purchases (Admin ve User)
router.get('/', protect, async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier', 'shopName')
      .populate('part', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Create purchase (Admin ve User)
router.post('/', protect, async (req, res) => {
  try {
    const { date, supplier, partName, quantity, price } = req.body;

    // Parça yoksa oluştur
    let part = await Part.findOne({ name: partName.trim() });
    if (!part) {
      part = await Part.create({ name: partName.trim() });
    }

    const totalCost = quantity * price;

    const purchase = await Purchase.create({
      date: date || Date.now(),
      supplier,
      part: part._id,
      quantity,
      price,
      totalCost,
      createdBy: req.user._id // Giriş yapan kullanıcı
    });

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('supplier', 'shopName')
      .populate('part', 'name')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populatedPurchase);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Update purchase (Admin ve User)
router.put('/:id', protect, async (req, res) => {
  try {
    const { date, supplier, partName, quantity, price } = req.body;

    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Satın alım bulunamadı' });
    }

    if (partName) {
      let part = await Part.findOne({ name: partName.trim() });
      if (!part) {
        part = await Part.create({ name: partName.trim() });
      }
      purchase.part = part._id;
    }

    purchase.date = date || purchase.date;
    purchase.supplier = supplier || purchase.supplier;
    purchase.quantity = quantity || purchase.quantity;
    purchase.price = price || purchase.price;
    purchase.totalCost = (quantity || purchase.quantity) * (price || purchase.price);

    await purchase.save();

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('supplier', 'shopName')
      .populate('part', 'name')
      .populate('createdBy', 'firstName lastName');

    res.json(populatedPurchase);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Delete purchase (Sadece Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Satın alım bulunamadı' });
    }

    await purchase.deleteOne();
    res.json({ message: 'Satın alım silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;

