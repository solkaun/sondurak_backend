const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');
const { protect, adminOnly } = require('../middleware/auth');

// Get all repairs (Admin only) - with search and pagination
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 8 } = req.query;
    
    // İlk olarak customerVehicle'larda ara
    let vehicleIds = [];
    if (search) {
      const CustomerVehicle = require('../models/CustomerVehicle');
      const vehicles = await CustomerVehicle.find({
        $or: [
          { customerName: { $regex: search, $options: 'i' } },
          { plate: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      vehicleIds = vehicles.map(v => v._id);
    }
    
    const query = search ? {
      $or: [
        { description: { $regex: search, $options: 'i' } },
        { customerVehicle: { $in: vehicleIds } }
      ]
    } : {};
    
    // Pagination hesaplamaları
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Toplam kayıt sayısı
    const total = await Repair.countDocuments(query);
    
    // Sayfalanmış veriler
    const repairs = await Repair.find(query)
      .populate('parts.part', 'name')
      .populate('customerVehicle', 'customerName customerPhone brand model plate')
      .populate('paidBy', 'firstName lastName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);
    
    res.json({
      repairs,
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

// Create repair (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { date, customerVehicle, currentKm, currentIssues, isOilChange, nextOilChangeKm, description, parts, laborCost } = req.body;

    if (!customerVehicle) {
      return res.status(400).json({ message: 'Müşteri aracı seçilmelidir' });
    }

    // Müşteri aracı bilgilerini al
    const CustomerVehicle = require('../models/CustomerVehicle');
    const vehicle = await CustomerVehicle.findById(customerVehicle);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Müşteri aracı bulunamadı' });
    }

    // Parça maliyetini hesapla
    let partsCost = 0;
    if (parts && parts.length > 0) {
      partsCost = parts.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }

    const totalCost = laborCost + partsCost;

    const repair = await Repair.create({
      date: date || Date.now(),
      customerVehicle,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      currentKm: currentKm || null,
      currentIssues: currentIssues || null,
      isOilChange: isOilChange || false,
      nextOilChangeKm: nextOilChangeKm || null,
      description,
      parts: parts || [],
      laborCost,
      partsCost,
      totalCost
    });

    // Eğer yağ bakımı yapıldıysa, araç bilgilerini güncelle
    if (isOilChange && currentKm) {
      vehicle.lastOilChangeKm = currentKm;
      vehicle.lastOilChangeDate = date || Date.now();
      await vehicle.save();
    }

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
    const { date, customerVehicle, currentKm, currentIssues, isOilChange, nextOilChangeKm, description, parts, laborCost } = req.body;

    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ message: 'Tamir kaydı bulunamadı' });
    }

    repair.date = date || repair.date;
    
    // Eğer customerVehicle değişiyorsa, yeni araç bilgilerini al
    if (customerVehicle && customerVehicle !== repair.customerVehicle.toString()) {
      const CustomerVehicle = require('../models/CustomerVehicle');
      const vehicle = await CustomerVehicle.findById(customerVehicle);
      
      if (!vehicle) {
        return res.status(404).json({ message: 'Müşteri aracı bulunamadı' });
      }
      
      repair.customerVehicle = customerVehicle;
      repair.brand = vehicle.brand;
      repair.model = vehicle.model;
      repair.plate = vehicle.plate;
    }
    
    repair.currentKm = currentKm !== undefined ? currentKm : repair.currentKm;
    repair.currentIssues = currentIssues !== undefined ? currentIssues : repair.currentIssues;
    repair.isOilChange = isOilChange !== undefined ? isOilChange : repair.isOilChange;
    repair.nextOilChangeKm = nextOilChangeKm !== undefined ? nextOilChangeKm : repair.nextOilChangeKm;
    repair.description = description || repair.description;
    repair.parts = parts || repair.parts;
    repair.laborCost = laborCost !== undefined ? laborCost : repair.laborCost;

    // Parça maliyetini yeniden hesapla
    repair.partsCost = repair.parts.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    repair.totalCost = repair.laborCost + repair.partsCost;

    // Eğer yağ bakımı yapıldıysa ve önceden yağ bakımı değilse, araç bilgilerini güncelle
    if (isOilChange && currentKm && !repair.isOilChange) {
      const CustomerVehicle = require('../models/CustomerVehicle');
      const vehicle = await CustomerVehicle.findById(repair.customerVehicle);
      if (vehicle) {
        vehicle.lastOilChangeKm = currentKm;
        vehicle.lastOilChangeDate = date || repair.date;
        await vehicle.save();
      }
    }

    await repair.save();

    const populatedRepair = await Repair.findById(repair._id)
      .populate('parts.part', 'name')
      .populate('customerVehicle', 'customerName customerPhone brand model plate');

    res.json(populatedRepair);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Mark payment as received (Admin only) - One time only
router.patch('/:id/payment', protect, adminOnly, async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ message: 'Tamir kaydı bulunamadı' });
    }

    // Eğer zaten ödenmiş ise işlem yapma
    if (repair.isPaid) {
      return res.status(400).json({ message: 'Bu tamir için ödeme zaten alınmış' });
    }

    // Sadece ödeme alındı olarak işaretle (geri alınamaz)
    repair.isPaid = true;
    repair.paidAt = new Date();
    repair.paidBy = req.user._id;

    await repair.save();

    const populatedRepair = await Repair.findById(repair._id)
      .populate('parts.part', 'name')
      .populate('customerVehicle', 'customerName customerPhone brand model plate')
      .populate('paidBy', 'firstName lastName');

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

