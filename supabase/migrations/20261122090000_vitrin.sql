-- Vitrin menüsü: kategoriler sitedeki bölümlere bağlanır (kahvalti, ana, alkol, icecek, patiseri, pasta).
-- urunler.foto_url: 'https://…' adresi ya da uygulamanın içindeki fotoğraf için 'yerel:<anahtar>'
-- (app/src/veri/fotolar.ts; araclar/menu_aktar.py üretir).
alter table public.kategoriler add column if not exists bolum text;
