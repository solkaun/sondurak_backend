const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const listUsers = async () => {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Tüm kullanıcıları getir
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log('ℹ️  Henüz kullanıcı yok\n');
      process.exit(0);
    }

    console.log(`📊 Toplam ${users.length} kullanıcı bulundu\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📱 Telefon: ${user.phone}`);
      console.log(`   🔑 Rol: ${user.role === 'admin' ? '👑 Admin' : '👤 User'}`);
      console.log(`   🆔 ID: ${user._id}`);
      console.log(`   📅 Oluşturulma: ${new Date(user.createdAt).toLocaleString('tr-TR')}`);
      console.log('   ─────────────────────────────────────────────────────────');
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

listUsers();

