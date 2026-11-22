// Yönetici, panelden personel (kasiyer / yönetici) ekler: e-postayla giriş hesabı + personel satırı.
// Çağıranın aktif yönetici olduğu sunucuda denetlenir. Geçici şifre yalnız yanıtta döner, saklanmaz.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const yanit = (durum: number, govde: unknown) =>
  new Response(JSON.stringify(govde), { status: durum, headers: { ...CORS, 'Content-Type': 'application/json' } });

function geciciSifre(): string {
  const harf = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(b, (x) => harf[x % harf.length]).join('');
}

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (istek.method !== 'POST') return yanit(405, { hata: 'Yalnız POST' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const yetki = istek.headers.get('Authorization') ?? '';
  // Çağıranın kimliği kendi oturumuyla (RLS altında) denetlenir
  const cagiran = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: yetki } } });
  const { data: yon, error: yonHata } = await cagiran.rpc('yonetici_mi');
  if (yonHata || yon !== true) return yanit(403, { hata: 'Bu işlem için yönetici olmalısınız.' });

  let g: { ad?: string; eposta?: string; rol?: string };
  try { g = await istek.json(); } catch { return yanit(400, { hata: 'Geçersiz istek' }); }
  const ad = String(g.ad ?? '').trim();
  const eposta = String(g.eposta ?? '').trim().toLowerCase();
  const rol = g.rol === 'yonetici' ? 'yonetici' : 'kasiyer';
  if (!ad || !/^\S+@\S+\.\S+$/.test(eposta)) return yanit(400, { hata: 'Ad ve geçerli bir e-posta gerekli.' });

  const yonetim = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const sifre = geciciSifre();
  const { data: k, error: kHata } = await yonetim.auth.admin.createUser({ email: eposta, password: sifre, email_confirm: true, user_metadata: { ad } });
  if (kHata || !k.user) return yanit(400, { hata: kHata?.message.includes('already') ? 'Bu e-postayla bir hesap zaten var.' : 'Hesap açılamadı.' });

  const { data: sube } = await yonetim.from('subeler').select('id').limit(1).maybeSingle();
  const { error: pHata } = await yonetim.from('personel').insert({ kullanici_id: k.user.id, ad, rol, sube_id: sube?.id ?? null });
  if (pHata) {
    await yonetim.auth.admin.deleteUser(k.user.id);
    return yanit(500, { hata: 'Personel kaydı yazılamadı.' });
  }
  return yanit(200, { kullanici_id: k.user.id, gecici_sifre: sifre });
});
