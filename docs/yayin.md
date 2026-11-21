# Mağaza yayını (kişisel geliştirici hesabıyla)

Karar: uygulama, şirket değil **T. Baran Dinç'in kişisel geliştirici hesaplarıyla** yayınlanır
(Apple takım kimliği fincosto iOS uygulamasıyla aynı hesap).

## Bunun sonuçları

- Mağazada **satıcı / geliştirici adı olarak kişi adı** görünür ("Hamour" uygulama adı olarak görünür).
- **Apple — marka izni:** Başkasına ait bir markanın uygulamasını kişisel hesapla yayınlamak mümkündür; ancak Apple
  inceleme sırasında markayı kullanma yetkisini sorabilir. Hamour'un sahibi şirketten ([unvan]) "Hamour markasının mobil uygulamasını
  geliştirme ve yayınlama yetkisi" veren **imzalı bir yetki yazısı** hazır tutulmalı ve gerekirse App Review'a eklenmeli.
- **Google Play — kapalı test şartı:** Kişisel hesaplar (13 Kasım 2023'ten sonra açılanlar) bir uygulamayı herkese
  açmadan önce **en az 12 kişiyle, 14 gün kesintisiz kapalı test** yapmak zorunda. Ekipten ve müdavimlerden 12+ test
  kullanıcısının e-posta adresi hazırlanmalı. Hesap daha eskiyse bu şart yoktur.
- İleride uygulama şirket hesabına **devredilebilir** (Apple "App Transfer", Google "Uygulama aktarımı"); kullanıcılar
  ve yorumlar korunur.

## Gerekenler

- Uygulama adı: **Hamour** (alt başlık önerisi: "Menü, kahve kartı ve kutlama pastası")
- Gizlilik politikası adresi (KVKK metni yayımlanacak bir web sayfası)
- Ekran görüntüleri (6,7" iPhone ve Android telefon) — uygulamadan alınır
- App Store "Uygulama Gizliliği" ve Google "Veri güvenliği" formları: `docs/hukuk/kvkk-aydinlatma.md`'deki veri
  listesine göre doldurulur (telefon, ad, isteğe bağlı doğum günü; izleme/reklam yok)
- İnceleme için **demo hesap**: SMS'siz giriş yapılabilen bir test numarası (Supabase'te test OTP olarak tanımlanır)

## Derleme

Expo EAS ile bulutta derlenir (`eas build`), TestFlight ve Google Play iç teste gönderilir (`eas submit`).
Bunun için Expo hesabı ve mağaza API anahtarları gerekir; fincosto iOS uygulamasındaki App Store Connect anahtarı
yeniden kullanılabilir.

## Önizleme (Expo Go)

Expo hesabı `baro6`, proje `@baro6/hamour` (henüz açılmadı: `cd app && npx eas-cli@latest init`). Erişim anahtarı
oturum ortamında gizli tutulur (koda/depoya yazılmaz). Yeni önizleme yayınlamak:

```bash
cd app
npx eas-cli@latest update --branch onizleme --environment preview --message "<ne değişti>"
```

Telefonda: Expo Go → expo.dev'deki güncelleme sayfasında "Preview" QR kodu. Supabase bilgileri `app/.env`'den
derlemeye girer.
