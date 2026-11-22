#!/usr/bin/env python3
"""hamour.com.tr menüsünü uygulamaya ve veritabanı başlangıç verisine aktarır.

Girdi : --html <dosya> verilirse hamour.com.tr/tr/menu/ sayfası (fiyatlı menü) ayrıştırılıp
        araclar/site-menu.json anlık görüntüsü yenilenir; verilmezse mevcut anlık görüntü kullanılır.
        --foto <klasör> verilirse sitenin /media/cache/ fotoğrafları (ur_*.jpg)
Uygulama aynı sayfayı çalışırken de okur (app/src/veri/siteMenu.ts); bu araç yalnız uygulamanın içindeki
yedek kopyayı ve veritabanı başlangıç verisini üretir. İki ayrıştırıcı aynı kimlikleri (kisa) üretmelidir.
Çıktı : app/src/veri/menuVerisi.ts   (örnek mod menüsü: kategoriler + ürünler)
        app/src/veri/fotolar.ts      (yerel fotoğraf haritası)
        app/assets/menu/*.jpg        (720 px genişlik)
        supabase/seed.sql
Fiyat: '745' → 745; '750 / 3570' (kadeh / şişe) → fiyat 750, fiyat_metni '750 ₺ / 3.570 ₺'.
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

def ayristir(html_metni):
    import html as h
    # <br> satır sonu → ', ' (siteMenu.ts ile aynı)
    temiz = lambda s: re.sub(r'\s+', ' ', h.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'\s*<br\s*/?>\s*', ', ', s or '')))).strip().strip(',').strip()
    adlar = [s for s, _ in BOLUMLER]
    panes = html_metni.split('class="tab-content-pane"')[1:]
    menu = []
    for i, p in enumerate(panes[:len(adlar)]):
        p = p.split('section-4')[0]
        bolum = dict(ad=adlar[i], gruplar=[])
        grup = None
        desen = (r'<h2>(.*?)</h2>|<div class="item[^"]*"(?: data-src="([^"]*)")?>\s*'
                 r'(?:<span class="fiyat">(.*?)</span>\s*)?<h3>(.*?)</h3>\s*(?:<p>(.*?)</p>)?')
        for m in re.finditer(desen, p, re.S):
            if m.group(1) is not None:
                grup = dict(ad=temiz(m.group(1)), urunler=[]); bolum['gruplar'].append(grup); continue
            if grup is None:
                grup = dict(ad=None, urunler=[]); bolum['gruplar'].append(grup)
            f = m.group(2)
            grup['urunler'].append(dict(ad=temiz(m.group(4)), aciklama=temiz(m.group(5)) or None,
                                        foto=None if (not f or 'avatar' in f) else f, fiyat=temiz(m.group(3)) or None))
        menu.append(bolum)
    if sum(len(g['urunler']) for b in menu for g in b['gruplar']) < 20:
        raise SystemExit('Menü sayfasının yapısı değişmiş: ürün bulunamadı.')
    return menu

def fiyat_coz(metin):
    if not metin: return None, None
    sayilar = [int(x) for x in re.findall(r'\d+', metin.replace('.', ''))]
    if not sayilar: return None, None
    if len(set(sayilar)) == 1: return sayilar[0], None  # '770 / 770' → tek fiyat
    bicim = lambda n: f'{n:,}'.replace(',', '.') + ' ₺'
    return sayilar[0], ' / '.join(bicim(n) for n in sayilar)

def main():
    if '--html' in sys.argv:
        menu = ayristir(Path(sys.argv[sys.argv.index('--html') + 1]).read_text(encoding='utf-8'))
        json.dump(menu, open(KOK / 'araclar/site-menu.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    foto_klasor = Path(sys.argv[sys.argv.index('--foto') + 1]) if '--foto' in sys.argv else None
    site = json.load(open(KOK / 'araclar/site-menu.json', encoding='utf-8'))
    kategoriler, urunler, fotolar = [], [], {}
    ksira = usira = 0
    kullanilan = set()
    for (sekme, bolum), b in zip(BOLUMLER, site):
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
                fiyat, fiyat_metni = fiyat_coz(u.get('fiyat'))
                urunler.append(dict(id=uid, kategori_id=kid, ad=u['ad'], aciklama=u['aciklama'], foto_url=foto, sira=usira,
                                    fiyat=fiyat, fiyat_metni=fiyat_metni))

    # app/src/veri/menuVerisi.ts
    j = lambda x: json.dumps(x, ensure_ascii=False)
    ts = ['// OTOMATİK ÜRETİLDİ: araclar/menu_aktar.py (kaynak hamour.com.tr menüsü). Elle düzenlemeyin.',
          "import type { Kategori, Urun } from './tipler';", '',
          'export const siteKategoriler: Kategori[] = [']
    ts += [f"  {{ id: {j(k['id'])}, ad: {j(k['ad'])}, bolum: {j(k['bolum'])}, sira: {k['sira']}, damga_verir: false }}," for k in kategoriler if k['gorunur']]
    ts += ['];', '', 'type SiteUrun = Pick<Urun, \'id\' | \'kategori_id\' | \'ad\' | \'aciklama\' | \'foto_url\' | \'sira\' | \'fiyat\' | \'fiyat_metni\'>;',
           'export const siteUrunler: SiteUrun[] = [']
    gorunen = {k['id'] for k in kategoriler if k['gorunur']}
    ts += [f"  {{ id: {j(u['id'])}, kategori_id: {j(u['kategori_id'])}, ad: {j(u['ad'])}, aciklama: {j(u['aciklama'])}, foto_url: {j(u['foto_url'])}, sira: {u['sira']}, fiyat: {j(u['fiyat'])}, fiyat_metni: {j(u['fiyat_metni'])} }},"
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
    sql = ['-- OTOMATİK ÜRETİLDİ: araclar/menu_aktar.py (kaynak hamour.com.tr/tr/menu/, fiyatlı).',
           '-- Alkollü içecek kategorileri gizli (gorunur = false); panelden açılabilir.',
           "insert into public.subeler (ad, adres, telefon) values",
           "  ('Hamour Beykoz', 'Acarlar Mah. 9. Cad., Beykoz / İstanbul', '0216 525 50 50');", '',
           'insert into public.kategoriler (id, ad, bolum, sira, damga_verir, gorunur) values']
    sql.append(',\n'.join(f"  ({q(k['id'])}, {q(k['ad'])}, {q(k['bolum'])}, {k['sira']}, false, {str(k['gorunur']).lower()})" for k in kategoriler) + ';')
    sql += ['', 'insert into public.urunler (kategori_id, ad, aciklama, foto_url, sira, fiyat, fiyat_metni) values']
    sql.append(',\n'.join(f"  ({q(u['kategori_id'])}, {q(u['ad'])}, {q(u['aciklama'])}, {q(u['foto_url'])}, {u['sira']}, {u['fiyat'] if u['fiyat'] is not None else 'null'}, {q(u['fiyat_metni'])})" for u in urunler) + ';')
    (KOK / 'supabase/seed.sql').write_text('\n'.join(sql) + '\n', encoding='utf-8')
    print(f'{len(kategoriler)} kategori, {len(urunler)} ürün, {len(fotolar)} fotoğraf')

if __name__ == '__main__':
    main()
