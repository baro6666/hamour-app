# Telefonla giriş: SMS kurulumu

Uygulamada şifre yok; giriş, telefona gelen 6 haneli kodla yapılır. Kod Supabase tarafından üretilir, SMS'i
Türkiye'deki bir sağlayıcı gönderir. Kod bu iş için hazır: `supabase/functions/sms-gonder` (Netgsm).

## Hamour'un yapacakları

1. **Netgsm** (ya da İleti Merkezi, Verimor vb.) ile kurumsal SMS hesabı açmak (şirket adına, vergi levhası ile).
2. **SMS başlığı (gönderici adı) başvurusu:** ör. `HAMOUR`. Onay birkaç iş günü sürebilir.
3. Netgsm panelinde **API alt kullanıcısı** oluşturmak (yalnız SMS gönderme yetkili).
4. Bu üç bilgiyi (alt kullanıcı adı, şifresi, onaylı başlık) Supabase'e girmek ya da güvenli bir yoldan bana
   iletmek. **Sohbete şifre yazılmaz.**
5. Kampanya SMS'i de gönderilecekse **İYS kaydı** (https://iys.org.tr, e-Devlet / şirket yetkilisiyle) ve
   sağlayıcıda İYS entegrasyonunun açılması.

## Benim yapacaklarım (bilgiler gelince)

1. `sms-gonder` fonksiyonunu Supabase'e yüklemek, gizli değerleri girmek
   (`NETGSM_KULLANICI`, `NETGSM_SIFRE`, `NETGSM_BASLIK`, `SEND_SMS_HOOK_SECRETS`).
2. Supabase → Authentication → Hooks → **Send SMS hook**'u bu fonksiyona bağlamak; telefonla girişi açmak.
3. Kendi numaramızla deneme girişi yapmak. (Netgsm uç noktası canlıya almadan önce güncel API belgesiyle doğrulanır.)

Maliyet: SMS başına sağlayıcı ücreti; her girişte bir SMS (oturum cihazda kalır, her açılışta SMS gitmez).
