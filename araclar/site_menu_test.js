// Uygulamanın canlı menü ayrıştırıcısını (app/src/veri/siteMenu.ts) dener ve uygulama içi kopyayla
// (menu_aktar.py çıktısı) karşılaştırır. Kullanım:
//   node araclar/site_menu_test.js [menü.html]     (dosya verilmezse hamour.com.tr/tr/menu/ indirilir)
const fs = require('fs');
const path = require('path');
const KOK = path.join(__dirname, '..');
const ts = require(path.join(KOK, 'app/node_modules/typescript'));

function yukle(dosya, sahte) {
  const kod = ts.transpileModule(fs.readFileSync(dosya, 'utf8'), { compilerOptions: { module: 'commonjs', target: 'es2022' } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', kod)((ad) => sahte[ad] ?? require(ad), m, m.exports);
  return m.exports;
}

(async () => {
  const fotoKodu = fs.readFileSync(path.join(KOK, 'app/src/veri/fotolar.ts'), 'utf8');
  const yerelFotolar = Object.fromEntries([...fotoKodu.matchAll(/^\s+"([^"]+)": require/gm)].map((x) => [x[1], 1]));
  const site = yukle(path.join(KOK, 'app/src/veri/siteMenu.ts'), {
    '@react-native-async-storage/async-storage': { default: { setItem: async () => {}, getItem: async () => null } },
    './fotolar': { yerelFotolar },
  });
  const html = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : await (await fetch(site.MENU_ADRESI)).text();
  const canli = site.menuyuAyristir(html);
  const kopya = yukle(path.join(KOK, 'app/src/veri/menuVerisi.ts'), {});
  let hata = 0;
  const esit = (ad, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) { hata++; console.log('FARK', ad, JSON.stringify(a), '≠', JSON.stringify(b)); } };
  esit('kategori sayısı', canli.kategoriler.length, kopya.siteKategoriler.length);
  esit('kategori kimlikleri', canli.kategoriler.map((k) => k.id), kopya.siteKategoriler.map((k) => k.id));
  esit('ürün sayısı', canli.urunler.length, kopya.siteUrunler.length);
  const harita = new Map(kopya.siteUrunler.map((u) => [u.id, u]));
  for (const u of canli.urunler) {
    const k = harita.get(u.id);
    if (!k) { hata++; console.log('YENİ / ADI DEĞİŞMİŞ', u.id); continue; }
    for (const a of ['kategori_id', 'ad', 'aciklama', 'foto_url', 'fiyat', 'fiyat_metni']) esit(`${u.id}.${a}`, u[a], k[a]);
  }
  esit('fiyatCoz', site.fiyatCoz('750 / 3570'), { fiyat: 750, fiyat_metni: '750 ₺ / 3.570 ₺' });
  esit('fiyatCoz tek', site.fiyatCoz('770 / 770'), { fiyat: 770, fiyat_metni: null });
  esit('fiyatCoz boş', site.fiyatCoz(''), { fiyat: null, fiyat_metni: null });
  console.log(`${canli.kategoriler.length} kategori, ${canli.urunler.length} ürün, ${canli.urunler.filter((u) => u.fiyat != null).length} fiyatlı, ${canli.urunler.filter((u) => u.foto_url).length} fotoğraflı`);
  console.log(hata ? `${hata} FARK (site değişmiş olabilir: python3 araclar/menu_aktar.py --html <sayfa> ile kopyayı yenileyin)` : 'TAMAM: canlı ayrıştırma uygulama içi kopyayla aynı');
  process.exit(hata ? 1 : 0);
})();
