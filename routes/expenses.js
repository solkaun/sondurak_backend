const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect, adminOnly } = require('../middleware/auth');

// Get all expenses (Admin only) - with search and pagination
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 8 } = req.query;
    
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    // Pagination hesaplamaları
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Toplam kayıt sayısı
    const total = await Expense.countDocuments(query);
    
    // Sayfalanmış veriler
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.json({
      expenses,
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

// Create expense (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { date, name, category, quantity, price } = req.body;

    const totalCost = quantity * price;

    const expense = await Expense.create({
      date: date || Date.now(),
      name,
      category,
      quantity,
      price,
      totalCost
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Update expense (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { date, name, category, quantity, price } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Gider bulunamadı' });
    }

    expense.date = date || expense.date;
    expense.name = name || expense.name;
    expense.category = category || expense.category;
    expense.quantity = quantity || expense.quantity;
    expense.price = price || expense.price;
    expense.totalCost = (quantity || expense.quantity) * (price || expense.price);

    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Delete expense (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Gider bulunamadı' });
    }

    await expense.deleteOne();
    res.json({ message: 'Gider silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;

