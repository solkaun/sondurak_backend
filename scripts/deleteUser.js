const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const deleteUser = async () => {
  try {
    const emailOrId = process.argv[2];

    if (!emailOrId) {
      console.log('❌ Kullanım: npm run delete-user <email-veya-id>');
      console.log('Örnek: npm run delete-user admin@sondurak.com');
      console.log('Örnek: npm run delete-user 507f1f77bcf86cd799439011');
      process.exit(1);
    }

    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Email veya ID ile kullanıcıyı bul
    let user;
    if (mongoose.Types.ObjectId.isValid(emailOrId)) {
      user = await User.findById(emailOrId);
    } else {
      user = await User.findOne({ email: emailOrId });
    }

    if (!user) {
      console.log('❌ Kullanıcı bulunamadı:', emailOrId);
      process.exit(1);
    }

    // Kullanıcı bilgilerini göster
    console.log('⚠️  Silinecek kullanıcı:');
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   👤 Ad Soyad: ${user.firstName} ${user.lastName}`);
    console.log(`   🔑 Rol: ${user.role}`);
    console.log(`   🆔 ID: ${user._id}\n`);

    // Sil
    await user.deleteOne();

    console.log('✅ Kullanıcı başarıyla silindi!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

deleteUser();

