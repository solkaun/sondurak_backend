// Güvenlik sabitleri
module.exports = {
  // JWT
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  JWT_COOKIE_EXPIRE: process.env.JWT_COOKIE_EXPIRE || 30,
  
  // Bcrypt
  BCRYPT_ROUNDS: 12,
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 dakika
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Auth rate limiting
  AUTH_RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 dakika
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: 5,
  
  // Maksimum dosya boyutu
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Password complexity
  MIN_PASSWORD_LENGTH: 6,
  
  // Database
  MONGODB_OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
};

