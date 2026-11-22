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

- Uygulama adı: **Hamour** (alt başlık önerisi: "Menü, rezervasyon ve kutlama pastası")
- Gizlilik politikası adresi (KVKK metni yayımlanacak bir web sayfası)
- Ekran görüntüleri (6,7" iPhone ve Android telefon) — uygulamadan alınır
- App Store "Uygulama Gizliliği" ve Google "Veri güvenliği" formları: uygulama kişisel veri toplamaz (üyelik yok;
  rezervasyon WhatsApp'ta kullanıcının kendi gönderdiği mesajla), izleme/reklam yok
- Demo hesap gerekmez (giriş yok)

## Derleme

Expo EAS ile bulutta derlenir (`eas build`), TestFlight ve Google Play iç teste gönderilir (`eas submit`).
Bunun için Expo hesabı ve mağaza API anahtarları gerekir; fincosto iOS uygulamasındaki App Store Connect anahtarı
yeniden kullanılabilir.

## Önizleme (Expo Go)

Expo hesabı `baro6` (butter ile aynı hesap), proje `@baro6/hamour` (kimlik `787fc91a-7b2e-4064-99fd-0b3758c45f3b`). Erişim anahtarı
oturum ortamında gizli tutulur (koda/depoya yazılmaz). Yeni önizleme yayınlamak:

```bash
cd app
npx eas-cli@latest update --branch onizleme --environment preview --message "<ne değişti>"
```

Telefonda: Expo Go ile `exp://u.expo.dev/update/<güncelleme grubu kimliği>` QR kodu (expo.dev'deki güncelleme
sayfasında da "Preview"). İlk önizleme 22.11.2026, dal `onizleme`.
