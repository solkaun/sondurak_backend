// Token güvenlik ekstraları
const jwt = require('jsonwebtoken');

// Token blacklist için basit in-memory store (production'da Redis kullanılabilir)
const tokenBlacklist = new Set();

// Token'ı blacklist'e ekle (logout/güvenlik ihlali durumunda)
exports.revokeToken = (token) => {
  tokenBlacklist.add(token);
};

// Token blacklist'te mi kontrol et
exports.isTokenRevoked = (token) => {
  return tokenBlacklist.has(token);
};

// Token freshness kontrolü - Token çok eski mi?
exports.checkTokenFreshness = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.decode(token);
    const tokenAge = Date.now() / 1000 - decoded.iat; // saniye cinsinden
    const maxAge = 30 * 24 * 60 * 60; // 30 gün

    // Token 30 günden eski mi? (ekstra kontrol)
    if (tokenAge > maxAge) {
      return res.status(401).json({
        success: false,
        message: 'Token çok eski, lütfen tekrar giriş yapın'
      });
    }

    next();
  } catch (error) {
    next();
  }
};

// Şüpheli aktivite kontrolü (opsiyonel)
exports.checkSuspiciousActivity = (req, res, next) => {
  // IP değişimi, unusual hours, vb. kontrol edilebilir
  // Şimdilik basit geçelim
  next();
};

// Token yenileme endpoint'i için helper
exports.refreshToken = async (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Logout - Token'ı blacklist'e ekle
exports.logoutHandler = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    tokenBlacklist.add(token);
  }

  res.json({
    success: true,
    message: 'Başarıyla çıkış yapıldı'
  });
};

// Cleanup - Expired token'ları blacklist'ten temizle (her 24 saatte bir)
setInterval(() => {
  const now = Date.now() / 1000;
  tokenBlacklist.forEach(token => {
    try {
      const decoded = jwt.decode(token);
      if (decoded.exp < now) {
        tokenBlacklist.delete(token);
      }
    } catch (error) {
      tokenBlacklist.delete(token);
    }
  });
}, 24 * 60 * 60 * 1000); // 24 saat

module.exports.tokenBlacklist = tokenBlacklist;

