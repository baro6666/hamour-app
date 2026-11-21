import { al, sb } from '../supabase';
import { Durum, useYukle } from './ortak';

function sayim(t: string, f?: (q: any) => any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  let q = sb.from(t).select('*', { count: 'exact', head: true });
  if (f) q = f(q);
  return q.then((r: { count: number | null; error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); return r.count ?? 0; });
}

export function Ozet() {
  const hafta = new Date(Date.now() - 7 * 86400000).toISOString();
  const { veri, hata, yukleniyor } = useYukle(async () => {
    const [uye, yeniUye, damga, bedava, talep, dusuk] = await Promise.all([
      sayim('uyeler'),
      sayim('uyeler', (q) => q.gte('olusturma', hafta)),
      sb.from('damga_hareketleri').select('adet').eq('tur', 'damga').gte('olusturma', hafta).then(al),
      sayim('damga_hareketleri', (q) => q.eq('tur', 'bedava').gte('olusturma', hafta)),
      sayim('on_siparis_talepleri', (q) => q.eq('durum', 'yeni')),
      sayim('puanlamalar', (q) => q.eq('durum', 'yeni').lte('puan', 3)),
    ]);
    return { uye, yeniUye, damga: (damga as { adet: number }[]).reduce((t, x) => t + x.adet, 0), bedava, talep, dusuk };
  });
  const kutular: [string, number | undefined, string][] = [
    ['Toplam üye', veri?.uye, `Son 7 gün +${veri?.yeniUye ?? 0}`],
    ['Son 7 gün verilen damga', veri?.damga, 'Kasa işlemlerinden'],
    ['Son 7 gün bedava kahve', veri?.bedava, 'Kullanılan haklar'],
    ['Bekleyen ön sipariş talebi', veri?.talep, 'Aranmayı bekleyen'],
    ['Dönüş bekleyen düşük puan', veri?.dusuk, '3 yıldız ve altı'],
  ];
  return (
    <>
      <h1>Özet</h1>
      <Durum hata={hata} yukleniyor={yukleniyor && !veri} />
      <div className="izgara">
        {kutular.map(([ad, sayi, alt]) => (
          <div key={ad} className="kart"><p className="soluk">{ad}</p><p className="sayi">{sayi ?? '—'}</p><p className="soluk">{alt}</p></div>
        ))}
      </div>
    </>
  );
}
