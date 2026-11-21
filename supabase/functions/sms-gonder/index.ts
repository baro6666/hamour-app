// Supabase "Send SMS" kancası → Netgsm. Telefonla girişteki doğrulama kodunu Türkiye'de Netgsm ile gönderir.
// Kurulum: docs/sms.md. Gizli değerler Supabase Edge Function secrets'ta tutulur, koda yazılmaz:
//   SEND_SMS_HOOK_SECRETS  (Auth → Hooks ekranının verdiği "v1,whsec_..." değeri)
//   NETGSM_KULLANICI, NETGSM_SIFRE (Netgsm API alt kullanıcısı), NETGSM_BASLIK (onaylı gönderici adı)
// Not: Netgsm uç noktası ve alan adları canlıya almadan önce Netgsm'in güncel API belgesiyle doğrulanmalı.
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

interface Kanca { user: { phone: string }; sms: { otp: string } }

Deno.serve(async (istek) => {
  const govde = await istek.text();
  let veri: Kanca;
  try {
    const sir = (Deno.env.get('SEND_SMS_HOOK_SECRETS') ?? '').replace('v1,whsec_', '');
    veri = new Webhook(sir).verify(govde, Object.fromEntries(istek.headers)) as Kanca;
  } catch {
    return yanit(401, 'Kanca imzası doğrulanamadı');
  }

  const no = veri.user.phone.replace(/\D/g, '').replace(/^90/, ''); // Netgsm: 5xxxxxxxxx
  const metin = `Hamour doğrulama kodunuz: ${veri.sms.otp}. Kodu kimseyle paylaşmayın.`;

  const kimlik = btoa(`${Deno.env.get('NETGSM_KULLANICI')}:${Deno.env.get('NETGSM_SIFRE')}`);
  const r = await fetch('https://api.netgsm.com.tr/sms/rest/v2/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${kimlik}` },
    body: JSON.stringify({
      msgheader: Deno.env.get('NETGSM_BASLIK'),
      encoding: 'TR',
      iysfilter: '0', // doğrulama kodu bilgilendirme iletisidir, İYS izni gerekmez
      messages: [{ msg: metin, no }],
    }),
  });
  const sonuc = await r.text();
  // Telefon ve kod loga yazılmaz; yalnız sağlayıcının durum kodu
  if (!r.ok || !/"code"\s*:\s*"00"/.test(sonuc)) {
    console.error('Netgsm gönderemedi', r.status, sonuc.slice(0, 200).replace(/\d{6,}/g, '***'));
    return yanit(502, 'SMS gönderilemedi');
  }
  return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
});

function yanit(durum: number, mesaj: string) {
  return new Response(JSON.stringify({ error: { http_code: durum, message: mesaj } }), {
    status: durum, headers: { 'Content-Type': 'application/json' },
  });
}
