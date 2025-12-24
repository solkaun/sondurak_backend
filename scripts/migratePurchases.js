const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Purchase = require('../models/Purchase');
const User = require('../models/User');

const migratePurchases = async () => {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // İlk admin kullanıcıyı bul
    const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    
    if (!adminUser) {
      console.log('❌ Admin kullanıcı bulunamadı. Önce bir admin oluşturun.');
      process.exit(1);
    }

    console.log(`✅ Admin kullanıcı bulundu: ${adminUser.firstName} ${adminUser.lastName}\n`);

    // createdBy alanı olmayan purchase'ları bul
    const purchasesWithoutCreator = await Purchase.find({ createdBy: { $exists: false } });

    if (purchasesWithoutCreator.length === 0) {
      console.log('ℹ️  Güncellenmesi gereken satın alım kaydı yok.\n');
      process.exit(0);
    }

    console.log(`📝 ${purchasesWithoutCreator.length} adet satın alım kaydı güncellenecek...\n`);

    // Tüm purchase'ları güncelle
    const result = await Purchase.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminUser._id } }
    );

    console.log(`✅ ${result.modifiedCount} adet satın alım kaydı güncellendi!`);
    console.log(`   Ekleyen: ${adminUser.firstName} ${adminUser.lastName}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

migratePurchases();

