# 🛠️ Kullanıcı Yönetim Scriptleri

Backend'den komut satırı ile kullanıcı yönetimi yapabilirsiniz.

## 📋 Komutlar

### 1. Yeni Kullanıcı Oluştur

**Hızlı oluşturma (varsayılan değerlerle):**
```bash
cd backend
npm run create-user
```

Bu varsayılan kullanıcıyı oluşturur:
- Email: admin@sondurak.com
- Şifre: 123456
- Ad: Admin
- Soyad: User
- Rol: admin

---

**Özel değerlerle oluşturma:**
```bash
cd backend
npm run create-user [ad] [soyad] [email] [şifre] [telefon] [yakın_telefon] [adres] [rol]
```

**Örnek:**
```bash
npm run create-user Ahmet Yılmaz ahmet@sondurak.com 123456 5551234567 5557654321 "İstanbul" admin
```

**Parametreler:**
1. Ad (örn: Ahmet)
2. Soyad (örn: Yılmaz)
3. Email (örn: ahmet@sondurak.com)
4. Şifre (örn: 123456)
5. Telefon (örn: 5551234567)
6. Yakın Telefon (örn: 5557654321)
7. Adres (örn: "İstanbul" - tırnak içinde)
8. Rol (admin veya user)

---

### 2. Tüm Kullanıcıları Listele

```bash
cd backend
npm run list-users
```

Çıktı örneği:
```
📊 Toplam 2 kullanıcı bulundu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ahmet Yılmaz
   📧 Email: ahmet@sondurak.com
   📱 Telefon: 5551234567
   🔑 Rol: 👑 Admin
   🆔 ID: 507f1f77bcf86cd799439011
   📅 Oluşturulma: 24.12.2024 10:30:45
   ─────────────────────────────────────────────────────────

2. Mehmet Demir
   📧 Email: mehmet@sondurak.com
   📱 Telefon: 5559876543
   🔑 Rol: 👤 User
   🆔 ID: 507f1f77bcf86cd799439012
   📅 Oluşturulma: 24.12.2024 11:15:20
   ─────────────────────────────────────────────────────────
```

---

### 3. Kullanıcı Sil

**Email ile:**
```bash
cd backend
npm run delete-user admin@sondurak.com
```

**ID ile:**
```bash
npm run delete-user 507f1f77bcf86cd799439011
```

⚠️ Onay vermeden direkt siler, dikkatli kullanın!

---

## 🚀 Hızlı Başlangıç Örnekleri

### İlk Admin Kullanıcı Oluştur
```bash
cd backend
npm run create-user Admin User admin@sondurak.com admin123 5551234567 5557654321 "Son Durak Oto Elektrik" admin
```

### Normal Kullanıcı Oluştur
```bash
npm run create-user Mehmet Demir mehmet@sondurak.com 123456 5559876543 5551112233 "Ankara" user
```

### Birden Fazla Kullanıcı Oluştur
```bash
npm run create-user "Ali" "Yıldız" "ali@sondurak.com" "ali123" "5551111111" "5552222222" "İstanbul" "admin"
npm run create-user "Ayşe" "Kaya" "ayse@sondurak.com" "ayse123" "5553333333" "5554444444" "Ankara" "user"
npm run create-user "Fatma" "Şahin" "fatma@sondurak.com" "fatma123" "5555555555" "5556666666" "İzmir" "user"
```

---

## 💡 İpuçları

1. **İlk kullanıcınızı admin olarak oluşturun:**
   ```bash
   npm run create-user
   ```
   Sonra frontend'den giriş yapın: admin@sondurak.com / 123456

2. **Kullanıcı oluşturmadan önce mevcut kullanıcıları kontrol edin:**
   ```bash
   npm run list-users
   ```

3. **Email tekrarı kontrolü var**, aynı email ile tekrar oluşturamaz

4. **Şifreler otomatik hashlenmiş olarak kaydedilir** (bcrypt)

5. **Frontend'den kullanıcı eklemek için:** Admin panelinden "Kullanıcılar" sayfasına gidin (sadece admin erişebilir)

---

## ⚙️ Script Detayları

### createUser.js
- Yeni kullanıcı oluşturur
- Email tekrar kontrolü yapar
- Şifreyi hashler
- Tüm bilgileri ekrana yazdırır

### listUsers.js
- Tüm kullanıcıları listeler
- Şifreleri göstermez (güvenlik)
- Tarih ve saat bilgisi verir
- Admin/user rollerini gösterir

### deleteUser.js
- Email veya ID ile kullanıcı siler
- Silmeden önce kullanıcı bilgilerini gösterir
- Geri alınamaz, dikkatli kullanın!

---

## 🔒 Güvenlik Notları

- ✅ Şifreler bcrypt ile 12 round hashlenmiş
- ✅ Email uniqueness kontrolü var
- ✅ MongoDB bağlantısı .env'den okunur
- ⚠️ Production'da güçlü şifreler kullanın
- ⚠️ Script loglarını paylaşmayın (şifre görünmez ama dikkatli olun)

---

## 🐛 Sorun Giderme

### "MongoDB bağlantı hatası"
```bash
# .env dosyasını kontrol edin
cat backend/.env

# MongoDB çalışıyor mu?
mongosh
```

### "Email zaten kayıtlı"
```bash
# Mevcut kullanıcıları listeleyin
npm run list-users

# Gerekirse silin
npm run delete-user email@example.com
```

### "Command not found"
```bash
# Backend dizininde olduğunuzdan emin olun
cd backend
pwd  # veya Windows'ta: cd
```

---

## 📞 Örnek Workflow

```bash
# 1. İlk admin kullanıcıyı oluştur
cd backend
npm run create-user

# 2. Oluşturuldu mu kontrol et
npm run list-users

# 3. Frontend'den giriş yap
# Email: admin@sondurak.com
# Şifre: 123456

# 4. Frontend'den (admin panelinde) diğer kullanıcıları ekle
# Veya script ile ekle:
npm run create-user Mehmet Yılmaz mehmet@sondurak.com mehmet123 5559876543 5551112233 "Ankara" user
```

Başarılar! 🚀

