# Hamour uygulaması — kapsam (ilk sürüm)

Bu belge Hamour'un ilk sürümünü tanımlar. İskelet ve kurallar butter uygulamasından alındı (Kasım 2026).
Uygulama yalnız Hamour'a aittir; Fincosto'dan ve butter'dan bağımsızdır, başka firmalara açılmaz.

## Hamour'a uyarlananlar

- **Marka:** hamour.com.tr'den ilham; Paris esintili patiseri, brasserie, bistro. Renkler ve logo **geçici**
  (bordo / krem, "H" monogramı); Hamour'un resmî logosu ve renkleri gelince `app/src/tema.ts`, `Logo.tsx`,
  `app/assets/` ve `panel/src/stil.css` değişir.
- **Menü:** sitedeki kategoriler ve ürün adları (`supabase/seed.sql`). **Sitede fiyat yok**, fiyatlar panelden girilir.
  Patiseri ve pasta ürün adları sitede yok; Hamour'dan alınacak.
- **Alkollü içecekler** kategorisi var ama gizli (`gorunur = false`); mağaza yaş sınırı kuralları nedeniyle.
- **Kahve kartı:** butter'daki gibi kahve ve çay damga verir; diğer kategoriler vermez (panelden değişir).
- **Ön sipariş:** kutlama pastası ve kruvasan kutusu ("Günü Hamour'da kutlayalım").
- **Şube:** Hamour Beykoz; çalışma saatleri bilinmiyor (boş).
- **Doğum günü ikramı:** butter'daki "doğum gününüzde bir tatlı" vaadi çıkarıldı; Hamour karar verince eklenir.

## Karar: sipariş ve ödeme yok

İlk sürümde uygulamadan sipariş verilmez, ödeme alınmaz, bakiye/cüzdan yoktur. Böylece:

- Kerzz'e sipariş aktarımı, ödeme kuruluşu, iade/iptal süreçleri gerekmez.
- Kasa ve mutfak düzeni değişmez.
- Elektronik para mevzuatı (6493) kapsamına girilmez.

Sipariş ve ödeme, üye tabanı oluştuktan sonra ayrı bir aşama olarak değerlendirilir.

## Parçalar

| Parça | Kim kullanır | Durum |
|---|---|---|
| Müşteri uygulaması (`app/`, iPhone + Android, Expo) | Müşteri | Bu PR'da iskelet ve ekranlar |
| Veritabanı ve kurallar (`supabase/`) | Hepsi | Bu PR'da şema, yetkiler ve testler |
| Kasa ekranı: "Damga ver" (`panel/`, web, telefon/tablet) | Kasiyer | Hazır, canlıda denendi |
| Yönetim paneli (`panel/`, web, bilgisayar) | Yönetici | Hazır, canlıda denendi |

## Müşteri uygulaması

- **Ana sayfa:** kahve kartı özeti, "fırından yeni çıktı", kampanyalar, marka tanıtımı, vitrinde öne çıkanlar, şube.
- **Menü:** kategoriler, ürünler, fiyat, vitrin durumu (Normal / Son birkaç / Fırından yeni çıktı / Tükendi).
- **Ürün sayfası:** açıklama, alerjen, kalori, damga verip vermediği, "yanına ne gider", favori.
- **Ön sipariş talebi:** bütün pasta, kutu kruvasan gibi ürünlerde. Ödeme yok; şube müşteriyi arar, ödeme teslimde.
- **Kahve kartı:** sunucuda imzalı, dakikada bir yenilenen QR; damgalar; son ziyaret puanlaması (1–5);
  gizli menü (kart bir kez dolunca açılır); arkadaşını getir (davet kodu).
- **Duyurular:** fırın, vitrin, kampanya, yeni ürün, etkinlik; okunmamış rozeti.
- **Hesap:** favoriler, bildirim izinleri (fırın, favoriler, kampanya = İYS ticari ileti izni), çıkış, **hesabı silme**
  (App Store şartı).
- **Giriş:** telefon + SMS kodu (şifre yok). İlk girişte ad, isteğe bağlı doğum günü, davet kodu, KVKK onayı,
  ayrı ve isteğe bağlı ticari ileti onayı.

Menü ve duyurular giriş yapmadan görülür; kart, favori ve talepler için üyelik gerekir.

## Kahve kartı kuralları (veritabanında, `supabase/migrations`)

- Damga yalnız kasada, personel oturumuyla, müşterinin **o anki** QR'ı okutularak verilir (`damga_ver`).
  QR `<üye>.<dakika>.<imza>` biçiminde, sunucudaki gizli anahtarla imzalı; en çok ~2 dakika geçerli.
- Aynı üyeye `tekrar_dakika` (varsayılan 10) içinde ikinci damga yalnız yönetici onayıyla.
- Damga veren kategoriler `kategoriler.damga_verir`; hedef (varsayılan 8) `kart_ayar.hedef_damga`, 3–15 arası.
- Kart dolunca 1 bedava kahve hakkı; artan damga yeni karta geçer. Hak kasada `bedava_kullandir` ile düşer.
- Davet: davet edilenin ilk damgasında ikisine de 1 damga.
- Müşteri kart, hareket ve puan tablolarına doğrudan yazamaz; yalnız fonksiyonlar değiştirir.
- Kasada müşterinin tam adı değil "Ayşe K." gösterilir.

Testler: `supabase/tests/calistir.sh` (yerel PostgreSQL'de, Supabase taklidiyle; 20 kural testi).

## Yayın için gerekenler (Hamour tarafı)

1. **Supabase projesi** (AB bölgesi, Frankfurt). Kurulunca `app/.env` doldurulur, migration ve seed yüklenir.
2. **SMS sağlayıcı** (telefonla giriş için): `docs/sms.md`.
3. **İYS kaydı** (ticari ileti için) ve **KVKK aydınlatma metni** (adresi `app/src/ayar.ts` → `KVKK_ADRESI`).
4. **Apple / Google:** T. Baran Dinç'in kişisel geliştirici hesapları kullanılır (`docs/yayin.md`: marka yetki yazısı,
   Google'ın 12 kişilik kapalı test şartı).
5. **İçerik:** ürün adı, kategori ve fiyat Kerzz'den otomatik; açıklama, alerjen, kalori ve (Kerzz'de yoksa)
   fotoğraf yönetim panelinden bir kez girilir.
6. **Kasa sistemi:** Hamour hangi POS'u kullanıyorsa (Kerzz vb.) ürün/fiyat aktarımı için yalnız okuma yetkili ayrı kullanıcı.

Hukuk metni taslakları: `docs/hukuk/` (avukat kontrolü gerekir). SMS kurulumu: `docs/sms.md`.

## Sonraki adımlar

1. **Rezervasyon talebi** (kahvaltı ve kutlamalar için; ödeme yok, şube arayıp onaylar).
2. Resmî logo, renkler ve ürün fotoğrafları; fiyatlar.
3. Mevsim kartı, doğum günü ikramı otomasyonu.
4. Kasa sisteminden ürün/fiyat aktarımı.
5. Mağaza yayını (EAS Build → TestFlight / Google Play iç test).

## Anlık bildirimler (hazır)

Panelde duyuru "anlık bildirim olarak da gönder" işaretliyse telefona gider. Kime: fırın → fırın bildirimi açık olanlar;
vitrin → ürünü favorisinde olanlar; kampanya / yeni ürün / etkinlik → yalnız İYS onayı verenler; kahve kartı → herkes.
Kural `bildirim_alicilari` fonksiyonunda, testli. Android'de Expo Go uzak bildirim desteklemez; gerçek derlemede çalışır.
