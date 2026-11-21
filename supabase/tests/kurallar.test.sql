-- Kahve kartı ve yetki kurallarının testi. Çalıştırma: supabase/tests/calistir.sh
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned
set client_min_messages = warning;

-- Hazırlık (süper kullanıcı)
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', '905550000001'),  -- üye A
  ('00000000-0000-0000-0000-00000000000b', '905550000002'),  -- üye B (A'nın davetiyle)
  ('00000000-0000-0000-0000-0000000000c1', null),            -- kasiyer
  ('00000000-0000-0000-0000-0000000000d1', null);            -- yönetici
insert into public.subeler (id, ad) values ('00000000-0000-0000-0000-000000000051', 'Hamour Beykoz');
insert into public.personel values
  ('00000000-0000-0000-0000-0000000000c1', 'Kasiyer', 'kasiyer', '00000000-0000-0000-0000-000000000051', true, now()),
  ('00000000-0000-0000-0000-0000000000d1', 'Yönetici', 'yonetici', '00000000-0000-0000-0000-000000000051', true, now());
insert into public.kategoriler values ('kahve', 'Kahveler', 1, true, true), ('tatli', 'Tatlılar', 2, false, true);
insert into public.urunler (id, kategori_id, ad, fiyat, on_siparis) values
  ('00000000-0000-0000-0000-0000000000e1', 'kahve', 'Latte', 150, false),
  ('00000000-0000-0000-0000-0000000000e2', 'tatli', 'Bütün San Sebastian', 2900, true);

create function pg_temp.olarak(p uuid) returns void language plpgsql as $$
begin
  if p is null then perform set_config('role', 'anon', false); perform set_config('request.jwt.claim.sub', '', false);
  else perform set_config('role', 'authenticated', false); perform set_config('request.jwt.claim.sub', p::text, false); end if;
end $$;
create function pg_temp.hata(p_sql text, p_beklenen text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'BEKLENEN HATA GELMEDİ: % (%)', p_beklenen, p_sql;
exception when others then
  if sqlerrm not like '%' || p_beklenen || '%' then raise exception 'YANLIŞ HATA: % beklenirken % (%)', p_beklenen, sqlerrm, p_sql; end if;
end $$;
create function pg_temp.esit(p_gercek anyelement, p_beklenen anyelement, p_ad text) returns void language plpgsql as $$
begin
  if p_gercek is distinct from p_beklenen then raise exception 'BAŞARISIZ: % — beklenen %, gelen %', p_ad, p_beklenen, p_gercek; end if;
  raise notice 'tamam: %', p_ad;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;
set client_min_messages = notice;

-- 1) Üyelik
select pg_temp.olarak('00000000-0000-0000-0000-00000000000a');
select pg_temp.esit((select telefon from public.uye_ol('Ayşe Kaya')), '905550000001', 'üye olunca telefon auth''tan gelir');
select pg_temp.olarak(null);
select pg_temp.hata($$select public.uye_ol('X')$$, 'permission denied');
select pg_temp.esit((select count(*) from public.urunler), 2::bigint, 'giriş yapmadan menü okunur');
select pg_temp.esit((select count(*) from public.uyeler), 0::bigint, 'anonim üyeleri göremez');

-- A davet kodunu B'ye söyler (B bu kodu tabloda göremez, uygulamaya elle yazar)
reset role;
select davet_kodu as kod_a from public.uyeler where id = '00000000-0000-0000-0000-00000000000a' \gset
select pg_temp.olarak('00000000-0000-0000-0000-00000000000b');
select pg_temp.esit((select davet_eden from public.uye_ol('Mehmet Demir', null, lower(:'kod_a'))),
                    '00000000-0000-0000-0000-00000000000a'::uuid, 'davet koduyla üye olunur');
select pg_temp.esit((select count(*) from public.uyeler where davet_kodu = :'kod_a'), 0::bigint, 'B, A''nın kaydını göremez');
select pg_temp.esit((select count(*) from public.uyeler), 1::bigint, 'üye yalnız kendini görür');
select pg_temp.hata($$update public.uyeler set telefon = '1' where id = auth.uid()$$, 'permission denied');
select pg_temp.hata($$update public.kartlar set hak = 99$$, 'permission denied');
select pg_temp.hata($$insert into public.damga_hareketleri (uye_id, tur, adet) values (auth.uid(), 'damga', 5)$$, 'row-level security');
select pg_temp.hata($$select public.damga_ver(public.benim_qr_kodum(), 1)$$, 'YETKI_YOK');
select pg_temp.hata($$select * from public.gizli_ayar$$, 'permission denied');
-- QR kodunu sakla (B)
select public.benim_qr_kodum() as qr_b \gset
select pg_temp.olarak('00000000-0000-0000-0000-00000000000a');
select public.benim_qr_kodum() as qr_a \gset

-- 2) Kasa
select pg_temp.olarak('00000000-0000-0000-0000-0000000000c1');
select pg_temp.esit((select ad from public.kasa_uye_bul(:'qr_a')), 'Ayşe K.', 'kasada ad kısaltılır');
select pg_temp.hata($$select public.kasa_uye_bul('x.y.z')$$, 'QR_GECERSIZ');
select pg_temp.hata(format('select public.kasa_uye_bul(%L)', regexp_replace(:'qr_a', '.$', 'x')), 'QR_GECERSIZ');
select pg_temp.hata(format('select public.kasa_uye_bul(%L)', '00000000-0000-0000-0000-00000000000a.1.abcdef0123456789'), 'QR_SURESI_DOLDU');
select pg_temp.esit((select damga from public.damga_ver(:'qr_a', 3)), 3, 'A: 3 damga');
select pg_temp.hata(format('select public.damga_ver(%L, 1)', :'qr_a'), 'ONAY_GEREKLI');
select pg_temp.hata(format('select public.damga_ver(%L, 1, true)', :'qr_a'), 'ONAY_GEREKLI');
select pg_temp.hata(format('select public.damga_ver(%L, 0)', :'qr_a'), 'ADET_GECERSIZ');

-- B'nin ilk damgası: davet bonusu, B: 1+1, A: 3+1
select pg_temp.esit((select damga from public.damga_ver(:'qr_b', 1)), 2, 'B: ilk damga + davet bonusu');
reset role;
select pg_temp.esit((select damga from public.kartlar where uye_id = '00000000-0000-0000-0000-00000000000a'), 4, 'A: davet bonusu aldı');

-- 3) Yönetici: 10 dk kuralını aşar, kart dolar
select pg_temp.olarak('00000000-0000-0000-0000-0000000000d1');
select pg_temp.esit((select row(damga, hak, yeni_hak)::text from public.damga_ver(:'qr_a', 5, true)), '(1,1,1)', 'A: 4+5 = kart doldu, 1 hak, 1 damga kaldı');
select pg_temp.esit((select hak from public.bedava_kullandir(:'qr_a')), 0, 'bedava kahve kullanıldı');
select pg_temp.hata(format('select public.bedava_kullandir(%L)', :'qr_a'), 'HAK_YOK');
select pg_temp.esit((select count(*) from public.uyeler), 2::bigint, 'yönetici tüm üyeleri görür');
update public.kart_ayar set hedef_damga = 10;
select pg_temp.esit((select hedef_damga from public.kart_ayar), 10, 'yönetici kuralı değiştirir');

select pg_temp.olarak('00000000-0000-0000-0000-0000000000c1');
select pg_temp.hata($$update public.kart_ayar set hedef_damga = 3$$, 'row-level security');
select pg_temp.esit((select count(*) from public.kart_ayar where hedef_damga = 10), 1::bigint, 'kasiyer kuralı değiştiremez');
select pg_temp.esit(public.kasa_bugun(), 4, 'kasiyerin bugünkü damgası (3 + 1)');

-- 4) Müşteri: kart, puan, ön sipariş, favori
select pg_temp.olarak('00000000-0000-0000-0000-00000000000a');
select pg_temp.esit((select kart_doldu from public.kartlar), 1, 'A gizli menüyü açtı');
select public.ziyaret_puanla((select max(id) from public.damga_hareketleri where tur = 'damga'), 2, 'Kahve soğuktu');
select pg_temp.esit((select puan from public.puanlamalar), 2, 'ziyaret puanlandı');
insert into public.on_siparis_talepleri (uye_id, urun_id, istenen_tarih) values (auth.uid(), '00000000-0000-0000-0000-0000000000e2', current_date + 2);
select pg_temp.hata($$insert into public.on_siparis_talepleri (uye_id, urun_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000e1')$$, 'row-level security');
select pg_temp.hata($$insert into public.on_siparis_talepleri (uye_id, urun_id, durum) values (auth.uid(), '00000000-0000-0000-0000-0000000000e2', 'onaylandi')$$, 'row-level security');
insert into public.favoriler (uye_id, urun_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000e1');
select pg_temp.hata($$insert into public.favoriler (uye_id, urun_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000e1')$$, 'row-level security');
select pg_temp.olarak('00000000-0000-0000-0000-00000000000b');
select pg_temp.esit((select count(*) from public.on_siparis_talepleri), 0::bigint, 'B, A''nın talebini göremez');
select pg_temp.hata(format('select public.ziyaret_puanla(%s, 5)', (select 1)), 'HAREKET_YOK');

-- 5) Hesap silme
select public.hesabimi_sil();
reset role;
select pg_temp.esit((select count(*) from public.uyeler where id = '00000000-0000-0000-0000-00000000000b'), 0::bigint, 'hesap silinince üye ve kartı gider');

-- 6) Anlık bildirim alıcıları (izinlere göre)
reset role;
update public.uyeler set push_token = 'ExponentPushToken[ornekA]' where id = '00000000-0000-0000-0000-00000000000a';
insert into public.duyurular (id, tur, baslik, urun_id, bildirim) values
  ('00000000-0000-0000-0000-0000000000f1', 'firin', 'Kruvasan çıktı', null, true),
  ('00000000-0000-0000-0000-0000000000f2', 'kampanya', 'Akşam fırsatı', null, true),
  ('00000000-0000-0000-0000-0000000000f3', 'vitrin', 'Latte vitrinde', '00000000-0000-0000-0000-0000000000e1', true),
  ('00000000-0000-0000-0000-0000000000f4', 'vitrin', 'Pasta vitrinde', '00000000-0000-0000-0000-0000000000e2', true);
insert into public.duyurular (tur, baslik, bildirim, yayin_zamani) values ('kampanya', 'Yarınki kampanya', true, now() + interval '1 day');
select pg_temp.esit((select count(*) from public.bildirim_alicilari('00000000-0000-0000-0000-0000000000f1')), 1::bigint, 'fırın bildirimi izinli üyeye gider');
select pg_temp.esit((select count(*) from public.bildirim_alicilari('00000000-0000-0000-0000-0000000000f2')), 0::bigint, 'kampanya, İYS izni olmayana gitmez');
select pg_temp.esit((select count(*) from public.bildirim_alicilari('00000000-0000-0000-0000-0000000000f3')), 1::bigint, 'vitrin bildirimi ürünü favorisinde olana gider');
select pg_temp.esit((select count(*) from public.bildirim_alicilari('00000000-0000-0000-0000-0000000000f4')), 0::bigint, 'vitrin bildirimi favorisi olmayana gitmez');
select pg_temp.olarak('00000000-0000-0000-0000-00000000000a');
update public.uyeler set kampanya_izni = true, kampanya_izni_tarih = now() where id = auth.uid();
update public.uyeler set bildirim_firin = false where id = auth.uid();
select pg_temp.hata($$select * from public.bildirim_alicilari('00000000-0000-0000-0000-0000000000f1')$$, 'permission denied');
select pg_temp.hata($$select * from public.bildirim_sirasi_al()$$, 'permission denied');
reset role;
select pg_temp.esit((select count(*) from public.bildirim_alicilari('00000000-0000-0000-0000-0000000000f2')), 1::bigint, 'üye kampanya iznini açınca kampanya gider');
select pg_temp.esit((select count(*) from public.bildirim_alicilari('00000000-0000-0000-0000-0000000000f1')), 0::bigint, 'üye fırın bildirimini kapatınca gitmez');
select pg_temp.esit((select count(*) from public.bildirim_sirasi_al()), 4::bigint, 'zamanı gelen 4 duyuru gönderime alınır (yarınki değil)');
select pg_temp.esit((select count(*) from public.bildirim_sirasi_al()), 0::bigint, 'aynı duyuru ikinci kez gönderilmez');
\echo TÜM TESTLER GEÇTİ
