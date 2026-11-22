// Zamanı gelen "bildirim" işaretli duyuruları izinli üyelerin telefonlarına gönderir (Expo Push).
// Her dakika pg_cron çağırır; panel de yayından hemen sonra çağırır. Kimlik gerekmez: yalnız sırası gelmiş
// ve henüz gönderilmemiş duyurular gönderilir, her biri bir kez (bildirim_sirasi_al aynı anda işaretler).
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const BASLIK: Record<string, string> = {
  firin: 'Fırından yeni çıktı', vitrin: 'Vitrinde', kampanya: 'Kampanya', yeni: 'Yeni ürün', etkinlik: 'Etkinlik', kart: 'Kahve kartı',
};

interface Duyuru { id: string; tur: string; baslik: string; metin: string | null; urun_id: string | null }
interface Bilet { status: 'ok' | 'error'; details?: { error?: string } }

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: sira, error } = await sb.rpc('bildirim_sirasi_al');
  if (error) return new Response(JSON.stringify({ hata: error.message }), { status: 500, headers: CORS });

  let gonderilen = 0;
  const gecersiz = new Set<string>();
  for (const d of (sira ?? []) as Duyuru[]) {
    const { data: alicilar } = await sb.rpc('bildirim_alicilari', { p_duyuru: d.id });
    const mesajlar = ((alicilar ?? []) as { push_token: string }[]).map((a) => ({
      to: a.push_token,
      title: d.baslik,
      body: d.metin ?? BASLIK[d.tur] ?? 'Hamour',
      sound: 'default',
      data: { duyuru_id: d.id, urun_id: d.urun_id, tur: d.tur },
    }));
    for (let i = 0; i < mesajlar.length; i += 100) {
      const parca = mesajlar.slice(i, i + 100);
      const r = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(parca),
      });
      const j = await r.json().catch(() => ({}));
      ((j.data ?? []) as Bilet[]).forEach((b, k) => {
        if (b.status === 'ok') gonderilen++;
        else if (b.details?.error === 'DeviceNotRegistered') gecersiz.add(parca[k].to);
      });
    }
  }
  // Uygulamayı silmiş telefonların anahtarlarını temizle
  if (gecersiz.size) await sb.from('uyeler').update({ push_token: null }).in('push_token', [...gecersiz]);

  return new Response(JSON.stringify({ duyuru: (sira ?? []).length, gonderilen, temizlenen: gecersiz.size }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
