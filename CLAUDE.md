# Hamour — müşteri uygulaması, kasa ve yönetim

Hamour (Paris esintili patiseri, brasserie ve bistro; Beykoz) için müşteri uygulaması ve işletme araçları.
**Yalnız Hamour'a aittir; Fincosto'dan ve butter'dan bağımsızdır** (başka markaya kod ya da veri karışmaz).
Arayüz ve iletişim dili Türkçe. İskelet `baro6666/butter-app`'ten kopyalandı (Kasım 2026).
Kapsam ve kararlar: `docs/kapsam.md`.

## Yapı

- `app/` — müşteri uygulaması (Expo SDK 58, Expo Router, TypeScript). Ekranlar `app/src/app/`.
  `app/AGENTS.md`'deki Expo kurallarına uy (paket eklerken `npx expo install`).
  - `src/veri/kaynak.ts`: Supabase ayarlıysa canlı, değilse cihaz içi örnek veri (`ornekMod`, SMS kodu 123456).
  - `src/tema.ts`: marka renkleri (hamour_pantoneler.pdf): %60 krem `#F6DCAF` (zemin), %30 kiremit `#B45A3C`
    (`renk.ana`: dolu kartlar, düğmeler), %10 koyu kahve `#3D1D0E` (yazı, logo). Yeni renk uydurma; bu üçünün tonlarını kullan.
    Başlıklar Playfair Display, gövde Jost, fiyatlar Montserrat.
  - `bilesenler/Logo.tsx`: `Logo` (yazı) ve `Simge` (üç yaprak) Hamour_Logo.ai'den vektör; kiremit kartlarda simge
    silik filigran (doku). Uygulama simgeleri `assets/*.png` aynı dosyadan üretildi.
- `panel/` — kasa ("Damga ver") ve yönetim paneli (Vite + React, HashRouter; yayın `panel/README.md`).
  Renkler `panel/src/stil.css`. Denetim: `cd panel && npm run build`.
- `supabase/functions/` — `personel-ekle`, `bildirim-gonder`, `sms-gonder` (SMS sağlayıcı bekliyor).
- `supabase/migrations/` — şema, RLS ve kahve kartı fonksiyonları. `supabase/seed.sql` başlangıç verisi
  (menü hamour.com.tr'den, fiyatsız; alkollü içecek kategorisi gizli).
- `supabase/tests/calistir.sh` — yerel PostgreSQL'de Supabase taklidiyle kural testleri.

## Kurallar

- İlk sürümde **sipariş, ödeme, bakiye yok**. Bunları eklemeden önce kullanıcıya sor.
- Damga / bedava kahve yalnız `SECURITY DEFINER` fonksiyonlarla değişir; tablolara istemciden yazma yetkisi açma.
- Kişisel veri (telefon, ad, doğum günü) işlenir: loglara, hata mesajlarına, commit'lere gerçek veri koyma.
- Fiyat, saat, istatistik uydurma; bilinmeyen değer `null` / köşeli parantezli yer tutucu.
- Değişiklikten sonra:
  - `cd app && npx tsc --noEmit && npx expo lint`
  - `supabase/tests/calistir.sh` (şemaya dokunulduysa; yeni kurala test ekle)
  - Ekran değiştiyse: `npx expo export --platform web` ile derleyip Playwright'la 390×844 ekran görüntüsüne bak.
- Değişiklikler dalda yapılır, `main`'e PR ile girer.
