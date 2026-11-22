# Hamour panel — yönetim (web)

- **Yönetim** (yalnız yönetici): duyurular, personel (ekle / pasif yap; `supabase/functions/personel-ekle`).
- Menü panelde düzenlenmez: uygulama hamour.com.tr/tr/menu/ sayfasını okur (sitede değişen her şey uygulamaya gelir).
  Kahve kartı ekranları Kasım 2026'da kaldırıldı.

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
