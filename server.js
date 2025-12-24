const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { apiLimiter, corsOptions } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Security Middleware
// HTTP headers güvenliği
app.use(helmet());

// CORS - Cross Origin Resource Sharing
app.use(cors(corsOptions));

// Body parser (JSON)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection koruması
app.use(mongoSanitize());

// XSS (Cross Site Scripting) koruması
app.use(xss());

// HTTP Parameter Pollution koruması
app.use(hpp());

// Rate limiting - Tüm API route'larına
app.use('/api/', apiLimiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/logout', require('./routes/logout'));
app.use('/api/users', require('./routes/users'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/parts', require('./routes/parts'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/analysis', require('./routes/analysis'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route bulunamadı'
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  console.log(`🔒 Güvenlik katmanları aktif`);
  console.log(`📊 Ortam: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

