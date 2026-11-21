# Hamour panel — kasa ve yönetim (web)

- **Damga ver** (kasiyer ve yönetici; telefon / tablet): müşterinin QR'ı kamerayla ya da barkod okuyucuyla okunur,
  damga verilir, bedava kahve kullandırılır. Aynı üyeye 10 dakika içinde ikinci damga yalnız yönetici onayıyla.
- **Yönetim** (yalnız yönetici): özet, ürünler ve vitrin durumu, duyurular, ön sipariş talepleri, ziyaret puanları,
  üyeler (CSV), kahve kartı kuralı, personel (ekle / pasif yap; `supabase/functions/personel-ekle`).

Adres: [https://hamour-panel.expo.app] (Expo hosting, proje `@baro6/hamour-panel`; henüz yayımlanmadı).

Yeni sürüm yayınlamak:

```bash
cd panel
npm run build
npx eas-cli@latest deploy --prod --export-dir dist
```

```bash
cd panel
npm install
npm run dev
```

Personel e-posta ve şifreyle giriş yapar. İlk yönetici hesabı: `docs/altyapi.md`.
