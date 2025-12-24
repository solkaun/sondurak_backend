const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Repair = require('../models/Repair');
const Expense = require('../models/Expense');
const { protect, adminOnly } = require('../middleware/auth');

// Get analysis data (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const query = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    // Parça satın alımları
    const purchases = await Purchase.find(query)
      .populate('supplier', 'shopName')
      .populate('part', 'name')
      .sort({ date: -1 });

    const totalPurchaseCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);
    const totalPartsCount = purchases.reduce((sum, p) => sum + p.quantity, 0);

    // Tamir edilen araçlar
    const repairs = await Repair.find(query)
      .populate('parts.part', 'name')
      .sort({ date: -1 });

    const totalRepairRevenue = repairs.reduce((sum, r) => sum + r.totalCost, 0);
    const totalLaborRevenue = repairs.reduce((sum, r) => sum + r.laborCost, 0);
    const totalPartsRevenue = repairs.reduce((sum, r) => sum + r.partsCost, 0);

    // Giderler
    const expenses = await Expense.find(query).sort({ date: -1 });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.totalCost, 0);

    // Net kar (İşçilik geliri - Giderler)
    const netProfit = totalLaborRevenue - totalExpenses;

    // Brüt kar (Toplam tamir geliri - Parça alım maliyeti - Giderler)
    const grossProfit = totalRepairRevenue - totalPurchaseCost - totalExpenses;

    res.json({
      purchases: {
        list: purchases,
        totalCost: totalPurchaseCost,
        totalCount: totalPartsCount,
        itemsCount: purchases.length
      },
      repairs: {
        list: repairs,
        totalRevenue: totalRepairRevenue,
        laborRevenue: totalLaborRevenue,
        partsRevenue: totalPartsRevenue,
        itemsCount: repairs.length
      },
      expenses: {
        list: expenses,
        totalCost: totalExpenses,
        itemsCount: expenses.length
      },
      summary: {
        netProfit,
        grossProfit,
        totalRevenue: totalRepairRevenue,
        totalCosts: totalPurchaseCost + totalExpenses
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;

