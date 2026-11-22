# Altyapı

## Supabase (henüz kurulmadı)

Hamour için **ayrı** bir Supabase projesi açılacak (butter'ınki kullanılmaz):

| | |
|---|---|
| Proje | `hamour` — [kimlik] |
| Bölge | Frankfurt (eu-central-1) |
| API adresi | [https://<kimlik>.supabase.co] |
| Yayımlanabilir anahtar | [sb_publishable_…] (uygulamaya gömülür, gizli değildir; yetkiyi RLS belirler) |

Kurulunca `app/.env` ve `panel/.env` (depoya girmez) doldurulur, sırayla yüklenir:

1. `supabase/migrations/` içindeki dosyalar, tarih sırasıyla
2. `supabase/seed.sql`
4. Edge Functions: `personel-ekle`, `bildirim-gonder` (ve SMS sağlayıcı gelince `sms-gonder`)

**Gizli anahtarlar (service_role, veritabanı şifresi) hiçbir dosyaya ve sohbete yazılmaz.**

### E-posta ile giriş (Hamour Kartı; SMS yok)

Supabase → Authentication:
1. **Sign In / Providers → Email:** açık; "Confirm email" açık. Phone sağlayıcısı kapalı kalır.
2. **Emails → Templates → Magic Link:** kodun görünmesi için gövdede `{{ .Token }}` olmalı (bağlantı değil). Önerilen:
   konu "Hamour doğrulama kodunuz", gövde "Kodunuz: <b>{{ .Token }}</b> — 10 dakika geçerli. Bu kodu kimseyle paylaşmayın."
3. **SMTP:** Supabase'in yerleşik postası saatte birkaç e-postayla sınırlı. Yayından önce özel SMTP (ör. Gmail / Google
   Workspace uygulama şifresi, Resend, Brevo) **Settings → Auth → SMTP** altına girilir; gönderen ör. `kart@hamour.com.tr`.
4. **Rate limits:** e-posta gönderimi ve OTP doğrulama sınırları varsayılan kalabilir.

### Bildirim zamanlayıcısı

`bildirim-gonder` her dakika çağrılır. Proje açılınca SQL editöründe bir kez (`<kimlik>` yerine proje kimliği):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('bildirim-gonder', '* * * * *',
  $c$select net.http_post(url := 'https://<kimlik>.supabase.co/functions/v1/bildirim-gonder',
                           headers := '{"Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb)$c$);
```

### İlk yönetici hesabı

Panelde personeli yönetici ekler; ilk yönetici bir kez elle açılır:
1. Supabase → Authentication → Users → **Add user** → kendi e-postanız ve **kendi seçtiğiniz** şifre
   ("Auto confirm" işaretli). Şifre kimseyle paylaşılmaz.
2. Bu kullanıcıyı personel tablosuna yönetici olarak eklemek (Claude ya da SQL editörü):
   `insert into personel (kullanici_id, ad, rol, sube_id) select id, '<Ad Soyad>', 'yonetici', (select id from subeler limit 1) from auth.users where email = '<e-posta>';`

## Expo

Hesap `baro6` (butter ile aynı). Uygulama projesi `@baro6/hamour` açıldı (22.11.2026; kimlik `app/app.json`'da,
EAS Update `onizleme` dalı). Panel projesi (`@baro6/hamour-panel`) henüz açılmadı.
