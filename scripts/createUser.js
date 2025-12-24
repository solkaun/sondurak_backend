const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const createUser = async () => {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Kullanıcı bilgilerini girin
    const userData = {
      firstName: process.argv[2] || 'Admin',
      lastName: process.argv[3] || 'User',
      email: process.argv[4] || 'admin@sondurak.com',
      password: process.argv[5] || '123456',
      phone: process.argv[6] || '5551234567',
      emergencyPhone: process.argv[7] || '5557654321',
      address: process.argv[8] || 'Son Durak Oto Elektrik',
      role: process.argv[9] || 'admin'
    };

    // Email kontrolü
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('❌ Bu email zaten kayıtlı:', userData.email);
      process.exit(1);
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Kullanıcı oluştur
    const user = await User.create({
      ...userData,
      password: hashedPassword
    });

    console.log('✅ Kullanıcı başarıyla oluşturuldu!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Kullanıcı Bilgileri:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Ad Soyad: ${user.firstName} ${user.lastName}`);
    console.log(`📱 Telefon: ${user.phone}`);
    console.log(`🔑 Rol: ${user.role}`);
    console.log(`🆔 ID: ${user._id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

createUser();

