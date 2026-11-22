// Çeviri denetimi: uygulamadaki çevrilecek Türkçe metinleri toplar, app/src/dil/ceviriler.ts'de İngilizce (en) ve
// Arapça (ar) karşılığı olmayanları listeler. Kullanım: node araclar/ceviri_test.js [--liste]
// Toplanan metinler: t('…'), <Yazi>düz metin</Yazi>, Yazi içindeki '…' dizgileri, yazi= / etiket= / metin= / baslik= / ust= /
// sag= / deger= özellikleri ve sabit içerik (icerik.ts, kvkk.tsx, rezervasyon OGUN, kategori adları, hoş geldin kampanyası).
const fs = require('fs');
const path = require('path');
const KOK = path.join(__dirname, '..');
const ts = require(path.join(KOK, 'app/node_modules/typescript'));

function dosyalar(dizin) {
  return fs.readdirSync(dizin, { withFileTypes: true }).flatMap((d) => {
    const y = path.join(dizin, d.name);
    return d.isDirectory() ? dosyalar(y) : /\.tsx?$/.test(d.name) ? [y] : [];
  });
}

const anahtarlar = new Map(); // metin → dosya
const ekle = (m, d) => { m = m.replace(/\s+/g, ' ').trim(); if (/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(m) && !anahtarlar.has(m)) anahtarlar.set(m, d); };
const OZELLIK = new Set(['yazi', 'etiket', 'metin', 'baslik', 'ust', 'sag', 'deger', 'title']);
const ICERIK_ALAN = new Set(['ad', 'baslik', 'metin', 'deger', 'etiket', 'kapsam']);
const ATLA = /(menuVerisi|menuCeviri|fotolar|ceviriler|siteMenu|kaynak|ornek|tipler|bildirim|tema|ayar|DilSaglayici)\.tsx?$/;

for (const dosya of dosyalar(path.join(KOK, 'app/src'))) {
  if (ATLA.test(dosya)) continue;
  const kisa = path.relative(KOK, dosya);
  const kaynak = ts.createSourceFile(dosya, fs.readFileSync(dosya, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const yazilar = (n) => { // bir ifadedeki tüm düz dizgiler (ternary dalları dahil)
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ekle(n.text, kisa);
    else ts.forEachChild(n, yazilar);
  };
  const icerikMi = /icerik\.ts$|kvkk\.tsx$|rezervasyon\.tsx$|kart\.tsx$/.test(dosya);
  const gez = (n, yaziIci) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 't' && n.arguments[0]) yazilar(n.arguments[0]);
    if (ts.isJsxElement(n)) {
      const ad = n.openingElement.tagName.getText();
      const yazi = ad === 'Yazi' && !n.openingElement.attributes.properties.some((p) => p.name?.getText() === 'cevirme');
      if (yazi) {
        const duz = n.children.filter((c) => ts.isJsxText(c)).map((c) => c.getText()).join(' ');
        if (n.children.every((c) => ts.isJsxText(c))) ekle(duz, kisa);
        for (const c of n.children) if (ts.isJsxExpression(c) && c.expression) yazilar(c.expression);
      }
      n.children.forEach((c) => gez(c, yazi));
      gez(n.openingElement, false);
      return;
    }
    if (ts.isJsxAttribute(n) && OZELLIK.has(n.name.getText()) && n.initializer) yazilar(n.initializer);
    if (icerikMi && ts.isPropertyAssignment(n) && ICERIK_ALAN.has(n.name.getText())) yazilar(n.initializer);
    if (icerikMi && ts.isArrayLiteralExpression(n)) n.elements.forEach((e) => (ts.isStringLiteral(e) ? ekle(e.text, kisa) : null));
    ts.forEachChild(n, (c) => gez(c, yaziIci));
  };
  gez(kaynak, false);
}
// Siteden gelen kategori adları (menu_aktar.py GRUP_AD) ve veritabanındaki hoş geldin kampanyası metinleri
const menuVerisi = fs.readFileSync(path.join(KOK, 'app/src/veri/menuVerisi.ts'), 'utf8');
for (const m of menuVerisi.matchAll(/^  \{ id: "[^"]+", ad: "([^"]+)", bolum:/gm)) ekle(m[1], 'kategori');
for (const m of ['Hoş geldin indirimi', 'Uygulamayı indirdiğiniz için ilk ziyaretinizde %5 indirim.', 'Alkollü içecekler hariç',
  'Bugün Patisserie’de %5 sizi bekliyor', 'Yalnız Patisserie ürünleri', 'Örnek veri modu: e-posta gitmez, kod 123456.',
  'Ürün bulunamadı', 'Kod hatalı (örnek modda 123456)']) ekle(m, 'elle');
// Çeviri gerektirmeyenler (özel ad, kısaltma, adres, e-posta, web)
const DEGISMEZ = new Set(['Hamour', 'Instagram', 'Facebook', 'Web', 'Royal Breakfast', 'Hamour Beykoz', 'info@hamour.com.tr',
  'www.hamour.com.tr', 'hamour.ist', 'Türkçe', 'English', 'العربية', 'TR', 'EN', 'ع', '%5',
  // kod içi kimlik ve kasıtlı Türkçe metinler (WhatsApp mesajı Hamour'a Türkçe gider)
  'hosgeldin', 'kampanya', 'pasta', 'Merhaba Hamour, rezervasyon yapmak istiyorum.']);

const kod = fs.readFileSync(path.join(KOK, 'app/src/dil/ceviriler.ts'), 'utf8');
const ceviriler = (() => { const m = { exports: {} }; new Function('module', 'exports', ts.transpileModule(kod, { compilerOptions: { module: 'commonjs' } }).outputText)(m, m.exports); return m.exports.ceviriler; })();

let eksik = 0;
const liste = process.argv.includes('--liste');
for (const [m, d] of anahtarlar) {
  if (DEGISMEZ.has(m) || /^[\d\s.,:%·₺/+-]+$/.test(m) || /^[A-Z0-9 &'.-]+$/.test(m) && !/[a-zçğıöşü]/.test(m) && m.length < 4) continue;
  const yok = ['en', 'ar'].filter((d2) => !ceviriler[d2][m]);
  if (yok.length) { eksik++; console.log(`EKSİK [${yok.join(',')}] ${JSON.stringify(m)}  (${d})`); }
  else if (liste) console.log('tamam', JSON.stringify(m));
}
// Yer tutucular karşılıkta da olmalı: '{n} kişi' → '{n} people'
for (const d2 of ['en', 'ar']) for (const [m, c] of Object.entries(ceviriler[d2])) {
  const a = (m.match(/\{\w+\}/g) ?? []).sort().join(), b = (c.match(/\{\w+\}/g) ?? []).sort().join();
  if (a !== b) { eksik++; console.log(`YER TUTUCU UYUŞMUYOR [${d2}] ${JSON.stringify(m)} → ${JSON.stringify(c)}`); }
}
console.log(eksik ? `${eksik} eksik çeviri` : `TAMAM: ${anahtarlar.size} metnin İngilizce ve Arapça karşılığı var`);
process.exit(eksik ? 1 : 0);
