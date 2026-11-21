# Hamour — müşteri uygulaması, kasa ve yönetim

Hamour (Paris esintili patiseri, brasserie ve bistro; Beykoz) için müşteri uygulaması ve işletme araçları.
**Yalnız Hamour'a aittir; Fincosto'dan ve butter'dan bağımsızdır** (başka markaya kod ya da veri karışmaz).
Arayüz ve iletişim dili Türkçe. İskelet `baro6666/butter-app`'ten kopyalandı (Kasım 2026).
Kapsam ve kararlar: `docs/kapsam.md`.

## Yapı

- `app/` — müşteri uygulaması (Expo SDK 58, Expo Router, TypeScript). Ekranlar `app/src/app/`.
  `app/AGENTS.md`'deki Expo kurallarına uy (paket eklerken `npx expo install`).
  - `src/veri/kaynak.ts`: Supabase ayarlıysa canlı, değilse cihaz içi örnek veri (`ornekMod`, SMS kodu 123456).
  - **Tanıtım ve vitrin menüsü uygulaması** (Kasım 2026 kararı): üyelik, giriş, kahve kartı, sipariş yok.
    Sekmeler: Keşfet, Menü (sitedeki 6 bölüm), Hamour (hikâye, kurumsal yapı, işbirlikleri, sosyal medya), İletişim.
    Sabit marka içeriği `src/veri/icerik.ts` (bilinmeyen alan null → ekranda görünmez).
  - `src/tema.ts`: marka renkleri (hamour_pantoneler.pdf) ekranda "baskı tonu" (Hamour'un seçimi C): dolu alan
    `#8E4630`, yazı/logo koyu kahve `#3D1D0E`, zemin `#F2E2C6`, koyu zemin üstü krem `#F6DCAF`. Turuncu kiremit `#B45A3C`
    büyük alanda kullanılmaz. Yeni renk uydurma. Başlıklar Playfair Display, gövde Jost, fiyatlar Montserrat.
  - Menü ve fotoğraflar hamour.com.tr'den: `python3 araclar/menu_aktar.py [--foto <site fotoğraf klasörü>]`
    → `src/veri/menuVerisi.ts`, `src/veri/fotolar.ts`, `assets/menu/*.jpg`, `supabase/seed.sql` (elle düzenleme).
    `foto_url` = `yerel:<anahtar>` (uygulama içi) ya da adres. Mekân görselleri `assets/gorsel/`.
  - `bilesenler/Logo.tsx`: `Logo` (yazı) ve `Simge` (üç yaprak) Hamour_Logo.ai'den vektör; kiremit kartlarda simge
    silik filigran (doku). Uygulama simgeleri `assets/*.png` aynı dosyadan üretildi.
- `panel/` — yönetim paneli: menü, duyurular, personel (Vite + React, HashRouter; yayın `panel/README.md`).
  Renkler `panel/src/stil.css`. Denetim: `cd panel && npm run build`.
- `supabase/functions/` — `personel-ekle`, `bildirim-gonder`, `sms-gonder` (SMS sağlayıcı bekliyor).
- `supabase/migrations/` — şema ve RLS (butter'dan kalan kahve kartı tabloları/fonksiyonları uygulamada kullanılmıyor).
  `supabase/seed.sql` başlangıç verisi (menü hamour.com.tr'den, fiyatsız; alkollü içecek kategorileri gizli).
- `supabase/tests/calistir.sh` — yerel PostgreSQL'de Supabase taklidiyle kural testleri.

## Kurallar

- **Sipariş, ödeme, üyelik, kahve kartı yok.** Bunları eklemeden önce kullanıcıya sor.
- Kişisel veri (telefon, ad, doğum günü) işlenir: loglara, hata mesajlarına, commit'lere gerçek veri koyma.
- Fiyat, saat, istatistik uydurma; bilinmeyen değer `null` / köşeli parantezli yer tutucu.
- Değişiklikten sonra:
  - `cd app && npx tsc --noEmit && npx expo lint`
  - `supabase/tests/calistir.sh` (şemaya dokunulduysa; yeni kurala test ekle)
  - Ekran değiştiyse: `npx expo export --platform web` ile derleyip Playwright'la 390×844 ekran görüntüsüne bak.
- Değişiklikler dalda yapılır, `main`'e PR ile girer.
