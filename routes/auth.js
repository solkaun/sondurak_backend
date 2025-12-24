const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Geçerli email gerekli'),
  body('password').notEmpty().withMessage('Şifre gerekli')
];

// NOT: Register endpoint kaldırıldı - güvenlik için
// Kullanıcı oluşturma:
// 1. Backend script: npm run create-user
// 2. Admin paneli: /users (sadece admin)

/* DISABLED - Use scripts/createUser.js or admin panel instead
// Register endpoint güvenlik için kapatıldı
// Kullanıcı oluşturmak için:
// 1. cd backend && npm run create-user
// 2. Admin panelinden /users sayfası
*/

// Login - Rate limited
router.post('/login', authLimiter, loginValidation, async (req, res, next) => {
  try {
    // Validation hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', protect, async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

