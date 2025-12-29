const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect, adminOnly } = require('../middleware/auth');

// Get all suppliers (Admin ve User - sadece okuma) - with search and pagination
router.get('/', protect, async (req, res) => {
  try {
    const { search, page = 1, limit = 8 } = req.query;
    
    const query = search ? {
      $or: [
        { shopName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    // Pagination hesaplamaları
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Toplam kayıt sayısı
    const total = await Supplier.countDocuments(query);
    
    // Sayfalanmış veriler
    const suppliers = await Supplier.find(query)
      .sort({ shopName: 1 })
      .skip(skip)
      .limit(limitNum);
    
    res.json({
      suppliers,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Create supplier (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { shopName, phone, address } = req.body;

    const supplier = await Supplier.create({
      shopName,
      phone,
      address
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Update supplier (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { shopName, phone, address } = req.body;

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Parçacı bulunamadı' });
    }

    supplier.shopName = shopName || supplier.shopName;
    supplier.phone = phone || supplier.phone;
    supplier.address = address || supplier.address;

    await supplier.save();
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Delete supplier (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Parçacı bulunamadı' });
    }

    await supplier.deleteOne();
    res.json({ message: 'Parçacı silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;

