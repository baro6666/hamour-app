#!/usr/bin/env python3
"""hamour.com.tr menüsünü uygulamaya ve veritabanı başlangıç verisine aktarır.

Girdi : araclar/site-menu.json (hamour.com.tr/tr/menumuz'dan çıkarılan anlık görüntü)
        --foto <klasör> verilirse sitenin /media/cache/ fotoğrafları (ur_*.jpg ve bölüm görselleri)
Çıktı : app/src/veri/menuVerisi.ts   (örnek mod menüsü: kategoriler + ürünler)
        app/src/veri/fotolar.ts      (yerel fotoğraf haritası)
        app/assets/menu/*.jpg        (720 px genişlik)
        supabase/seed.sql
Sitede fiyat yok: fiyatlar boş kalır, panelden girilir.
"""
import json, re, sys, unicodedata
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
TR = str.maketrans('çğıöşüÇĞİÖŞÜâéÉ', 'cgiosuCGIOSUaeE')

def kisa(s):
    s = unicodedata.normalize('NFC', s).translate(TR).lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

BOLUMLER = [  # site sekmesi → bölüm kimliği (sıra sitedeki gibi)
    ('Royal Breakfast', 'kahvalti'), ('Ana Yemekler', 'ana'), ('Alkollü İçecekler', 'alkol'),
    ('İçecekler', 'icecek'), ('Patiseri', 'patiseri'), ('Pasta', 'pasta'),
]
GRUP_AD = {
    None: 'Royal Breakfast', 'PIZZAS': 'Pizzalar', 'BOWL & SALAD': 'Bowl & salata', 'STARTER': 'Başlangıçlar',
    'BURGER & BRIOCHE': 'Burger & brioche', 'SANDWICHES': 'Sandviçler', 'PASTA & RISOTTO': 'Makarna & risotto',
    'BEEF': 'Et, tavuk, balık', 'MATCHAS': 'Matcha', 'SMOOTHIE • DETOKS • FRUIT JUICE': 'Smoothie · detoks · meyve suyu',
    'COFFEES': 'Kahveler', 'TEAS': 'Çaylar', 'SOFT DRINKS': 'Meşrubat & su',
}

def grup_ad(g):
    return GRUP_AD.get(g) or g.title().replace('Rosé', 'Rosé').replace(' • ', ' · ')

def main():
    foto_klasor = Path(sys.argv[sys.argv.index('--foto') + 1]) if '--foto' in sys.argv else None
    site = json.load(open(KOK / 'araclar/site-menu.json', encoding='utf-8'))
    kategoriler, urunler, fotolar = [], [], {}
    ksira = usira = 0
    kullanilan = set()
    for (sekme, bolum), b in zip(BOLUMLER, site):
        assert b['ad'] == sekme, (b['ad'], sekme)
        for g in b['gruplar']:
            kid = 'kahvalti' if g['ad'] is None else kisa(g['ad'])
            ksira += 1
            kategoriler.append(dict(id=kid, ad=grup_ad(g['ad']), bolum=bolum, sira=ksira, gorunur=bolum != 'alkol'))
            for u in g['urunler']:
                uid = kisa(u['ad'])
                while uid in kullanilan: uid += '-2'
                kullanilan.add(uid)
                usira += 1
                foto = None
                if u['foto'] and foto_klasor:
                    kaynak = foto_klasor / Path(u['foto']).name
                    if kaynak.exists():
                        from PIL import Image
                        hedef = KOK / 'app/assets/menu' / f'{uid}.jpg'
                        hedef.parent.mkdir(parents=True, exist_ok=True)
                        im = Image.open(kaynak).convert('RGB')
                        im.thumbnail((720, 1080), Image.LANCZOS)
                        im.save(hedef, quality=78, optimize=True, progressive=True)
                if (KOK / 'app/assets/menu' / f'{uid}.jpg').exists():
                    foto = f'yerel:{uid}'
                    fotolar[uid] = f'../../assets/menu/{uid}.jpg'
                urunler.append(dict(id=uid, kategori_id=kid, ad=u['ad'], aciklama=u['aciklama'], foto_url=foto, sira=usira))

    # app/src/veri/menuVerisi.ts
    j = lambda x: json.dumps(x, ensure_ascii=False)
    ts = ['// OTOMATİK ÜRETİLDİ: araclar/menu_aktar.py (kaynak hamour.com.tr menüsü). Elle düzenlemeyin.',
          "import type { Kategori, Urun } from './tipler';", '',
          'export const siteKategoriler: Kategori[] = [']
    ts += [f"  {{ id: {j(k['id'])}, ad: {j(k['ad'])}, bolum: {j(k['bolum'])}, sira: {k['sira']}, damga_verir: false }}," for k in kategoriler if k['gorunur']]
    ts += ['];', '', 'type SiteUrun = Pick<Urun, \'id\' | \'kategori_id\' | \'ad\' | \'aciklama\' | \'foto_url\' | \'sira\'>;',
           'export const siteUrunler: SiteUrun[] = [']
    gorunen = {k['id'] for k in kategoriler if k['gorunur']}
    ts += [f"  {{ id: {j(u['id'])}, kategori_id: {j(u['kategori_id'])}, ad: {j(u['ad'])}, aciklama: {j(u['aciklama'])}, foto_url: {j(u['foto_url'])}, sira: {u['sira']} }},"
           for u in urunler if u['kategori_id'] in gorunen]
    ts += ['];', '']
    (KOK / 'app/src/veri/menuVerisi.ts').write_text('\n'.join(ts), encoding='utf-8')

    # app/src/veri/fotolar.ts
    fs = ['// OTOMATİK ÜRETİLDİ: araclar/menu_aktar.py. Ürün fotoğrafları uygulamanın içinde (hamour.com.tr\'den, 720 px).',
          "import type { ImageSourcePropType } from 'react-native';", '',
          'export const yerelFotolar: Record<string, ImageSourcePropType> = {']
    fs += [f"  {j(k)}: require({j(v)})," for k, v in fotolar.items()]
    fs += ['};', '']
    (KOK / 'app/src/veri/fotolar.ts').write_text('\n'.join(fs), encoding='utf-8')

    # supabase/seed.sql
    q = lambda s: 'null' if s is None else "'" + s.replace("'", "''") + "'"
    sql = ['-- OTOMATİK ÜRETİLDİ: araclar/menu_aktar.py (kaynak hamour.com.tr menüsü). Fiyatlar boş; panelden girilir.',
           '-- Alkollü içecek kategorileri gizli (gorunur = false); panelden açılabilir.',
           "insert into public.subeler (ad, adres, telefon) values",
           "  ('Hamour Beykoz', 'Acarlar Mah. 9. Cad., Beykoz / İstanbul', '0216 525 50 50');", '',
           'insert into public.kategoriler (id, ad, bolum, sira, damga_verir, gorunur) values']
    sql.append(',\n'.join(f"  ({q(k['id'])}, {q(k['ad'])}, {q(k['bolum'])}, {k['sira']}, false, {str(k['gorunur']).lower()})" for k in kategoriler) + ';')
    sql += ['', 'insert into public.urunler (kategori_id, ad, aciklama, foto_url, sira) values']
    sql.append(',\n'.join(f"  ({q(u['kategori_id'])}, {q(u['ad'])}, {q(u['aciklama'])}, {q(u['foto_url'])}, {u['sira']})" for u in urunler) + ';')
    (KOK / 'supabase/seed.sql').write_text('\n'.join(sql) + '\n', encoding='utf-8')
    print(f'{len(kategoriler)} kategori, {len(urunler)} ürün, {len(fotolar)} fotoğraf')

if __name__ == '__main__':
    main()
