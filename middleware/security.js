const rateLimit = require('express-rate-limit')

// Genel API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 10000, // 100 istek
  message: 'Bu IP adresinden çok fazla istek geldi, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
})

// Auth route'ları için daha sıkı limiter
exports.authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 5, // 5 başarısız deneme
  skipSuccessfulRequests: true, // Başarılı istekleri sayma
  message: 'Çok fazla giriş denemesi, lütfen 1 dakika sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
})

// Şifre sıfırlama için limiter
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // 3 istek
  message: 'Çok fazla şifre sıfırlama isteği, lütfen 1 saat sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
})

// CORS yapılandırması
exports.corsOptions = {
  origin: function (origin, callback) {
    // Geliştirme ortamında tüm originlere izin ver
    if (process.env.NODE_ENV === 'development') {
      callback(null, true)
    } else {
      // Production'da sadece belirli domainlere izin ver
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : ['http://localhost:3000']
      
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('CORS policy tarafından engellendi'))
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}

