const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isTokenRevoked } = require('./tokenSecurity');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Erişim yetkisi yok - Token bulunamadı' 
    });
  }

  // Token blacklist'te mi kontrol et
  if (isTokenRevoked(token)) {
    return res.status(401).json({
      success: false,
      message: 'Token geçersiz kılınmış, lütfen tekrar giriş yapın'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcıyı veritabanından al
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token geçerli ancak kullanıcı bulunamadı' 
      });
    }
    
    req.user = user;
    req.token = token; // Token'ı sonraki middleware'ler için sakla
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token süresi dolmuş, lütfen tekrar giriş yapın' 
      });
    }
    return res.status(401).json({ 
      success: false,
      message: 'Token geçersiz' 
    });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Bu işlem için admin yetkisi gerekli' 
    });
  }
};

// Kullanıcının kendi kaydını veya admin ise herhangi bir kaydı düzenlemesine izin ver
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `${req.user.role} rolü bu işlem için yetkili değil`
      });
    }
    next();
  };
};

