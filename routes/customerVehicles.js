const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const CustomerVehicle = require('../models/CustomerVehicle');
const Repair = require('../models/Repair');
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

// Generate QR Code for a vehicle (Admin ve User)
router.get('/:id/qr', protect, async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Araç bulunamadı' });
    }

    // QR kod URL'i - frontend public sayfasına yönlendirecek
    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/vehicle/${vehicle.qrCode}`;
    
    // QR kod oluştur (base64 image)
    const qrCodeImage = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      qrCode: vehicle.qrCode,
      qrUrl,
      qrCodeImage,
      vehicle: {
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        customerName: vehicle.customerName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'QR kod oluşturulamadı', error: error.message });
  }
});

// PUBLIC ENDPOINT - QR kod ile araç geçmişi görüntüleme (Login gerektirmez)
router.get('/public/:qrCode', async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findOne({ qrCode: req.params.qrCode });
    if (!vehicle) {
      return res.status(404).json({ message: 'Araç bulunamadı' });
    }

    // Tamir geçmişini getir
    const repairs = await Repair.find({ customerVehicle: vehicle._id })
      .populate('parts.part', 'name')
      .sort({ date: -1 });

    // Son yağ bakımını bul
    const lastOilChange = repairs.find(repair => 
      repair.description && repair.description.toLowerCase().includes('yağ')
    );

    // Gelecek yağ bakımı tahmini
    let nextOilChange = null;
    if (vehicle.lastOilChangeKm && vehicle.lastOilChangeDate) {
      const kmSinceLastChange = repairs[0]?.currentKm 
        ? repairs[0].currentKm - vehicle.lastOilChangeKm 
        : 0;
      
      const remainingKm = vehicle.oilChangeIntervalKm - kmSinceLastChange;
      
      nextOilChange = {
        lastChangeKm: vehicle.lastOilChangeKm,
        lastChangeDate: vehicle.lastOilChangeDate,
        intervalKm: vehicle.oilChangeIntervalKm,
        currentKm: repairs[0]?.currentKm || vehicle.lastOilChangeKm,
        remainingKm: remainingKm > 0 ? remainingKm : 0,
        isOverdue: remainingKm <= 0,
        estimatedNextKm: vehicle.lastOilChangeKm + vehicle.oilChangeIntervalKm
      };
    }

    // İstatistikler
    const totalRepairs = repairs.length;
    const totalCost = repairs.reduce((sum, repair) => sum + repair.totalCost, 0);
    const totalParts = repairs.reduce((sum, repair) => sum + repair.parts.length, 0);

    res.json({
      vehicle: {
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        customerName: vehicle.customerName,
        customerPhone: vehicle.customerPhone
      },
      statistics: {
        totalRepairs,
        totalCost,
        totalParts,
        firstRepairDate: repairs.length > 0 ? repairs[repairs.length - 1].date : null,
        lastRepairDate: repairs.length > 0 ? repairs[0].date : null
      },
      nextOilChange,
      repairs: repairs.map(repair => ({
        _id: repair._id,
        date: repair.date,
        currentKm: repair.currentKm,
        currentIssues: repair.currentIssues,
        description: repair.description,
        parts: repair.parts.map(p => ({
          name: p.part.name,
          quantity: p.quantity,
          price: p.price
        })),
        laborCost: repair.laborCost,
        partsCost: repair.partsCost,
        totalCost: repair.totalCost
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;

