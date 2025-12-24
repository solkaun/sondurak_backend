const express = require('express');
const router = express.Router();
const Part = require('../models/Part');
const { protect } = require('../middleware/auth');

// Get all parts
router.get('/', protect, async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    
    const parts = await Part.find(query).sort({ name: 1 });
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Create part (otomatik oluşturulacak)
router.post('/', protect, async (req, res) => {
  try {
    const { name } = req.body;

    // Parça zaten varsa mevcut olanı döndür
    let part = await Part.findOne({ name: name.trim() });
    if (part) {
      return res.json(part);
    }

    // Yoksa yeni oluştur
    part = await Part.create({ name: name.trim() });
    res.status(201).json(part);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;

