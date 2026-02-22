# Reminder Engine Test Checklist (Backend)

Bu doküman, Renewly backend tarafındaki Reminder Engine davranışını **manuel** ve **tekrarlanabilir** şekilde doğrulamak için hazırlanmıştır.

## 1) Ön Koşullar

Aşağıdaki adımları test öncesi mutlaka tamamlayın:

1. **Environment değişkenleri**
   - `DATABASE_URL` doğru bir test/veritabanı instance’ına işaret etmeli.
   - `JWT_SECRET` (veya projede kullanılan auth secret) tanımlı olmalı.
   - Reminder/Cron ile ilgili env alanları (varsa) test ortamına uygun ayarlanmalı.

2. **Veritabanı erişimi**
   - DB ayağa kalkmış ve backend’den erişilebilir olmalı.
   - Migration’lar uygulanmış olmalı.

3. **Prisma generate**
   ```bash
   npm run prisma:generate
   ```
   > Projede farklı script adı varsa (örn: `npx prisma generate`), ilgili komutu kullanın.

4. **Server start**
   ```bash
   npm run dev
   ```
   veya
   ```bash
   npm run start:dev
   ```
   > Projedeki gerçek script adına göre çalıştırın.

5. **Log takibi**
   - Terminal logları açık kalsın.
   - Mümkünse ayrı bir terminalde DB kayıtlarını takip edin (NotificationLog vb.).

---

## 2) Postman ile Test Akışı (Adım Adım)

Aşağıdaki akış, tüm senaryolar için temel setup olarak kullanılabilir.

### A. Register
1. `POST /auth/register` (veya projedeki register endpoint’i) çağrısı yapın.
2. Farklı test user’ları için en az iki hesap açın:
   - `userA`
   - `userB`
3. Yanıtın başarılı (`2xx`) olduğunu doğrulayın.

### B. Login
1. `POST /auth/login` çağrısı yapın.
2. Dönen `accessToken` (veya eşdeğer JWT) değerini alın.
3. Postman Collection/Environment içine kaydedin:
   - `tokenUserA`
   - `tokenUserB`

### C. Token Kullanımı
1. İsteklerde `Authorization` header kullanın:
   - `Authorization: Bearer {{tokenUserA}}`
2. Senaryoya göre kullanıcı değiştirin (`tokenUserB`).

### D. Create Subscription
1. `POST /subscriptions` endpoint’ini çağırın.
2. Reminder ile ilgili alanları özellikle set edin:
   - `status`
   - `nextBillingDate`
   - `reminderDaysBefore`
3. Senaryoya göre aynı kullanıcı için birden fazla subscription oluşturun.

### E. Reminder Engine tetikleme
1. Cron bekleme veya debug/test cron endpoint’i (varsa) ile job’ı tetikleyin.
2. Terminal log + DB NotificationLog kayıtlarını birlikte doğrulayın.

---

## 3) Test Senaryoları

> Not: Her senaryoda, mümkünse test öncesi ilgili kullanıcıya ait subscription/log verisini temizleyin veya benzersiz test verisi kullanın.

### 1) `reminderDay == today` iken log oluşur
- **Setup**
  - `status = ACTIVE`
  - `nextBillingDate` ve `reminderDaysBefore` kombinasyonu sonucu `reminderDay` bugün olacak.
- **Aksiyon**
  - Reminder cron tetiklenir.
- **Beklenen**
  - İlgili subscription için NotificationLog kaydı oluşur.
  - Log/response içinde reminder oluşturulduğuna dair bilgi görülür.

### 2) `reminderDay != today` iken log oluşmaz
- **Setup**
  - `status = ACTIVE`
  - `reminderDay` bugünden farklı olacak şekilde tarih ayarla.
- **Aksiyon**
  - Cron tetiklenir.
- **Beklenen**
  - NotificationLog oluşmaz.
  - İşlem skip edildiğine dair debug/info log görülebilir.

### 3) `status != ACTIVE` ise kontrol edilmez
- **Setup**
  - `status = CANCELED` veya `PAUSED` (projede desteklenen pasif statü).
- **Aksiyon**
  - Cron tetiklenir.
- **Beklenen**
  - Reminder eligibility kontrolüne girmez (veya fail-fast skip edilir).
  - NotificationLog oluşmaz.

### 4) `reminderDaysBefore = 0` davranışı
- **Setup**
  - `reminderDaysBefore = 0`
  - `nextBillingDate = today`
- **Aksiyon**
  - Cron tetiklenir.
- **Beklenen**
  - Sistem tasarımına göre “aynı gün hatırlatma” kabul ediliyorsa log oluşur.
  - Kabul edilmiyorsa DTO/domain validation ile açık hata dönmeli.
  - Beklenen davranış takım tarafından netleştirilip test notuna işlenmeli.

### 5) `reminderDaysBefore` negatif / çok büyük değer
- **Setup**
  - Örnek değerler: `-1`, `9999`
- **Aksiyon**
  - Subscription create/update isteği atılır.
- **Beklenen**
  - DTO validation hatası (`400 Bad Request`) dönmeli.
  - Hata mesajı alan bazlı ve açıklayıcı olmalı.

### 6) `nextBillingDate` null/invalid
- **Setup**
  - `nextBillingDate = null` veya parse edilemeyen format.
- **Aksiyon**
  - Subscription create/update isteği atılır.
- **Beklenen**
  - Validation/domain hatası dönmeli.
  - Cron aşamasına bozuk veri taşınmamalı.

### 7) Aynı gün duplicate engeli (`NotificationLog` unique + `P2002` handling)
- **Setup**
  - Aynı subscription için aynı gün bir kez log oluşturulmuş durumda.
- **Aksiyon**
  - Cron aynı gün tekrar tetiklenir.
- **Beklenen**
  - İkinci insert unique constraint’e takılırsa sistem idempotent davranmalı.
  - `P2002` yakalanıp servis crash etmeden güvenli şekilde skip edilmeli.
  - Aynı güne ait ikinci NotificationLog oluşmamalı.

### 8) Farklı user izolasyonu
- **Setup**
  - `userA` ve `userB` için ayrı subscription’lar oluştur.
- **Aksiyon**
  - `userA` token ile list/monitor endpoint’leri çağrılır.
- **Beklenen**
  - `userA`, `userB` subscription/log kayıtlarını göremez.
  - Reminder üretimi user bazında doğru izolasyonla çalışır.

### 9) Timezone/day-start normalize testi (`00:00` vs `23:00` edge)
- **Setup**
  - Aynı takvim gününe denk gelen fakat saat farkı içeren tarih setleri oluştur:
    - Ör: `2026-01-10T00:00:00`
    - Ör: `2026-01-10T23:00:00`
- **Aksiyon**
  - Cron tetikle ve hangi gün olarak normalize edildiğini izle.
- **Beklenen**
  - Gün karşılaştırması sistemin referans timezone’una göre deterministik olmalı.
  - Off-by-one day hatası olmamalı.

### 10) Cron tetikleniyor mu (dev test cron / prod cron)
- **Setup**
  - Dev ortamda kısa interval test cron (varsa) açılır.
- **Aksiyon**
  - Belirli süre loglar izlenir.
- **Beklenen**
  - Job’ın schedule’a uygun tetiklendiği görülür.
  - Prod cron ifadesiyle uyumluluk dokümante edilir (sıklık ve zamanlama farkları not edilir).

---

## 4) Beklenen Log Örnekleri

Aşağıdakiler örnek formatlardır; gerçek log anahtarları projedeki logger yapısına göre değişebilir.

```text
[ReminderEngine] scan_started runId=... now=2026-01-10T08:00:00.000Z
[ReminderEngine] subscription_evaluated subscriptionId=... status=ACTIVE reminderDay=2026-01-10 isDue=true
[ReminderEngine] notification_log_created subscriptionId=... userId=... date=2026-01-10
```

```text
[ReminderEngine] subscription_evaluated subscriptionId=... status=ACTIVE reminderDay=2026-01-12 isDue=false
[ReminderEngine] skipped_not_due subscriptionId=... reason=REMINDER_DAY_NOT_TODAY
```

```text
[ReminderEngine] notification_log_duplicate subscriptionId=... date=2026-01-10 prismaCode=P2002 action=SKIP
```

```text
[ReminderEngine] subscription_skipped subscriptionId=... reason=STATUS_NOT_ACTIVE
```

---

## 5) Debug/Test Cron Kapatma Notları (TODO)

- **TODO:** Debug amaçlı açılan kısa interval cron konfigürasyonunu prod öncesi kapat.
- **TODO:** Test için eklenen endpoint/flag (örn. manual trigger) erişimini yetki altına al veya kaldır.
- **TODO:** Test env’e özel cron expression değerlerinin prod `.env` ile karışmadığını kontrol et.
- **TODO:** Duplicate/validation testlerinden kalan kirli test verilerini temizle.

---

## 6) Hızlı Kontrol Listesi (Checklist)

- [ ] Env değişkenleri doğru
- [ ] DB ve migration hazır
- [ ] Prisma generate tamam
- [ ] Server ayağa kalktı
- [ ] Postman token akışı çalışıyor
- [ ] Subscription create başarılı
- [ ] 10 senaryonun tamamı koşuldu
- [ ] Beklenen loglar doğrulandı
- [ ] Debug/test cron ayarları geri alındı
