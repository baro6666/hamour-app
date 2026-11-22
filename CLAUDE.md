# Hamour — müşteri uygulaması, kasa ve yönetim

Hamour (Paris esintili patiseri, brasserie ve bistro; Beykoz) için müşteri uygulaması ve işletme araçları.
**Yalnız Hamour'a aittir; Fincosto'dan ve butter'dan bağımsızdır** (başka markaya kod ya da veri karışmaz).
Arayüz ve iletişim dili Türkçe. İskelet `baro6666/butter-app`'ten kopyalandı (Kasım 2026).
Kapsam ve kararlar: `docs/kapsam.md`.

## Yapı

- `app/` — müşteri uygulaması (Expo SDK 58, Expo Router, TypeScript). Ekranlar `app/src/app/`.
  `app/AGENTS.md`'deki Expo kurallarına uy (paket eklerken `npx expo install`).
  - `src/veri/kaynak.ts`: Supabase ayarlıysa canlı, değilse cihaz içi örnek veri (`ornekMod`, e-posta kodu 123456).
  - **Tanıtım ve vitrin menüsü uygulaması**; sipariş, ödeme, kahve kartı (damga) yok.
    Sekmeler: Keşfet, Menü (sitedeki 6 bölüm), Kart, Hamour (hikâye, kurumsal yapı, işbirlikleri, sosyal medya), İletişim.
  - **Hamour Kartı** (22.11.2026 kararı): **e-posta + 6 haneli kod** ile üyelik (SMS YOK — sahibin kararı; telefon
    numarası istenmez). `src/app/giris.tsx`, `src/app/(sekmeler)/kart.tsx`. Kart dakikada değişen imzalı QR gösterir;
    kasiyer panelde "İndirim okut" (`panel/src/Kasa.tsx`) ile okutur → `kasa_kampanyalar` / `kampanya_uygula`.
    **Hoş geldin indirimi: %5, yalnız ilk ziyaret, alkollü içecekler hariç** (kampanyalar.tur = 'hosgeldin', tek).
    Diğer kampanyalar panelde (`panel/src/yonetim/Kampanyalar.tsx`): oran, kapsam, süre, kişi başı bir kez / sınırsız,
    isteğe bağlı anlık bildirim (yalnız kampanya_izni olan üyelere). Kullanım yalnız SECURITY DEFINER fonksiyonla yazılır.
    Hesap silme ve aydınlatma metni (`src/app/kvkk.tsx`, taslak) uygulamada.
    Sabit marka içeriği `src/veri/icerik.ts` (bilinmeyen alan null → ekranda görünmez).
    **Rezervasyon** `src/app/rezervasyon.tsx`: gün / öğün / saat / kişi / ad / not → WhatsApp'ta hazır mesaj
    (`wa.me/<ILETISIM.whatsapp>`); hiçbir yere kaydedilmez, onay Hamour'da.
    Üst başlık (`Yazi tur="ust"`) büyük harfi dile göre `toLocaleUpperCase` ile yapılır; `textTransform: 'uppercase'` kullanma (i→I).
  - **Diller: Türkçe (asıl), İngilizce, Arapça** (`src/dil/`). Telefon dili EN/AR ise o dil, yoksa TR; kullanıcı Keşfet kapağından
    ya da Hamour sekmesinden değiştirir (cihazda saklanır). Metinler Türkçe yazılır: `Yazi` ve `Dugme` düz metni kendiliğinden
    çevirir (`cevirme` ile kapatılır), hesaplanan metin `t('… {n} …', { n })`. Karşılıklar `src/dil/ceviriler.ts`;
    **yeni metin eklerken İngilizce ve Arapçasını da ekle** — `node araclar/ceviri_test.js` eksikleri yakalar (CI'da).
    Arapça: sağdan sola (kökte Yoga `direction: 'rtl'`, yeniden başlatma yok), Tajawal / Amiri yazı tipleri (`yaziAilesi`),
    yön okları `rtl` ile çevrilir, yüzde `yuzde(n)` (TR %5, EN/AR 5%). WhatsApp rezervasyon mesajı her dilde Türkçe gider.
  - Menü çevirisi `src/veri/menuCeviri.ts` (üretilir): İngilizce hamour.com.tr/en/menu/'den (`--html-en`, sırası farklı;
    fotoğraf/fiyatla eşlenir, `ELLE_EN` düzeltmeleri), Arapça `araclar/ceviri-ar.json` (Claude çevirisi; gözden geçirilmeli).
    Çevirisi olmayan yeni ürün: Arapçada İngilizce, o da yoksa Türkçe. `urunMetni(u, dil)`.
  - `src/tema.ts`: marka renkleri (hamour_pantoneler.pdf) ekranda "baskı tonu" (Hamour'un seçimi C): dolu alan
    `#8E4630`, yazı/logo koyu kahve `#3D1D0E`, zemin `#F2E2C6`, koyu zemin üstü krem `#F6DCAF`. Turuncu kiremit `#B45A3C`
    büyük alanda kullanılmaz. Yeni renk uydurma. Başlıklar Playfair Display, gövde Jost, fiyatlar Montserrat.
  - **Menü kaynağı hamour.com.tr/tr/menu/ (fiyatlı).** Uygulama açılışta sayfayı okur (`src/veri/siteMenu.ts`):
    önce cihazda saklanan son menü, sonra siteden güncel hali; site açılmazsa saklanan, o da yoksa uygulama içi kopya.
    Panelde menü düzenlenmez. Fiyat '750 / 3570' (kadeh / şişe) → `fiyat` + `fiyat_metni`. Alkollü bölüm gizli.
  - Uygulama içi kopya ve seed: `python3 araclar/menu_aktar.py --html <menu sayfası> [--foto <site fotoğrafları>]`
    → `src/veri/menuVerisi.ts`, `src/veri/fotolar.ts`, `assets/menu/*.jpg`, `supabase/seed.sql` (elle düzenleme).
    İki ayrıştırıcı aynı kimlik kuralını (`kisa`) kullanır; denetim: `node araclar/site_menu_test.js [sayfa.html]`
    (canlı sayfa ile kopyayı karşılaştırır; site yapısı değişirse burada yakalanır).
    `foto_url` = `yerel:<kimlik>` (uygulama içi) ya da sitedeki adres (yeni ürün). Mekân görselleri `assets/gorsel/`.
  - `bilesenler/Logo.tsx`: `Logo` (yazı) ve `Simge` (üç yaprak) Hamour_Logo.ai'den vektör; kiremit kartlarda simge
    silik filigran (doku). Uygulama simgeleri `assets/*.png` aynı dosyadan üretildi.
- `panel/` — kasa ("İndirim okut", tüm personel) ve yönetim: kampanyalar, duyurular, personel (Vite + React, HashRouter; yayın `panel/README.md`).
  Renkler `panel/src/stil.css`. Denetim: `cd panel && npm run build`.
- `supabase/functions/` — `personel-ekle`, `bildirim-gonder` (`sms-gonder` butter'dan kaldı, kullanılmıyor).
- `supabase/migrations/` — şema ve RLS (butter'dan kalan kahve kartı tabloları/fonksiyonları uygulamada kullanılmıyor).
  `supabase/seed.sql` başlangıç verisi (menü hamour.com.tr'den, fiyatsız; alkollü içecek kategorileri gizli).
- `supabase/tests/calistir.sh` — yerel PostgreSQL'de Supabase taklidiyle kural testleri.

## Kurallar

- **Sipariş, ödeme, kahve kartı (damga), SMS yok.** Bunları eklemeden önce kullanıcıya sor.
- Kampanya kullanımı / indirim yalnız SECURITY DEFINER fonksiyonlarla değişir; tablolara istemciden yazma yetkisi açma.
- Kişisel veri (ad, e-posta) işlenir: loglara, hata mesajlarına, commit'lere gerçek veri koyma.
- Fiyat, saat, istatistik uydurma; bilinmeyen değer `null` / köşeli parantezli yer tutucu.
- Değişiklikten sonra:
  - `cd app && npx tsc --noEmit && npx expo lint`
  - `supabase/tests/calistir.sh` (şemaya dokunulduysa; yeni kurala test ekle)
  - `node araclar/site_menu_test.js` (menü ayrıştırmasına ya da `menu_aktar.py`'ye dokunulduysa)
  - Ekran değiştiyse: `npx expo export --platform web` ile derleyip Playwright'la 390×844 ekran görüntüsüne bak.
- Değişiklikler dalda yapılır, `main`'e PR ile girer.

## Birleştirme (sahibin kalıcı kararı, 22.11.2026)

T. Baran Dinç'in açık isteği: **Claude kendi açtığı PR'ları kendisi birleştirir**; sahip PR'da ayrıca onay/merge yapmaz.
- Akış: dalda çalış → yukarıdaki denetimleri yerelde çalıştır → push → PR aç (taslak değil) → PR'ı izle →
  GitHub Actions `Denetim` akışının (`.github/workflows/denetim.yml`) tüm işleri yeşil olunca **squash merge** →
  dalı `main`'den yeniden başlat.
- Denetimlerden biri kırmızıysa birleştirme yok: kök nedeni bul, düzelt, yeniden gönder. Testi atlama / kapatma yok.
- Yalnız Claude'un kendi açtığı, bu oturumda kullanıcının istediği işi içeren PR'lar. Başkasının PR'ını birleştirme.
- Mağazaya gönderim (EAS submit), Supabase'e yükleme, sürüm yayını gibi dışa dönük adımlar bu izne dahil değil: ayrıca sor.
- GitHub makineleri www.hamour.com.tr'ye bağlanamıyor; CI'daki site menüsü işi ayrıştırıcıyı depodaki sayfa kopyasına
  (`araclar/site-menu.html`) karşı dener. Canlı siteyle karşılaştırmayı (`node araclar/site_menu_test.js`) menüye
  dokunan her işte oturumda çalıştır; fark varsa `python3 araclar/menu_aktar.py --html <yeni sayfa>` ile kopyayı yenile.
