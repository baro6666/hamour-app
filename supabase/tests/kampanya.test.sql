-- Hamour Kartı: e-posta üyeliği, hoş geldin indirimi ve kampanya kuralları. Çalıştırma: supabase/tests/calistir.sh
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned
set client_min_messages = warning;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'Elif@Ornek.Test'),   -- üye E (e-posta ile)
  ('00000000-0000-0000-0000-0000000000f2', 'can@ornek.test');    -- üye F

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

-- 1) E-posta ile üyelik
select pg_temp.olarak('00000000-0000-0000-0000-0000000000f1');
select pg_temp.esit((select eposta from public.uye_ol('Elif Yılmaz', null, null, true)), 'elif@ornek.test', 'üye olunca e-posta auth''tan gelir (küçük harf)');
select pg_temp.hata($$update public.uyeler set eposta = 'x@y.z' where id = auth.uid()$$, 'permission denied');

-- 2) Hoş geldin indirimi herkese görünür, üye kendi durumunu görür
select pg_temp.olarak(null);
select pg_temp.esit((select count(*) from public.kampanyalar where tur = 'hosgeldin'), 1::bigint, 'giriş yapmadan hoş geldin kampanyası görülür');
select pg_temp.hata($$select * from public.benim_kampanyalarim()$$, 'permission denied');
select pg_temp.olarak('00000000-0000-0000-0000-0000000000f1');
select pg_temp.esit((select oran from public.benim_kampanyalarim() where tur = 'hosgeldin'), 5, 'hoş geldin %5');
select pg_temp.esit((select kullanildi from public.benim_kampanyalarim() where tur = 'hosgeldin'), null::timestamptz, 'henüz kullanılmadı');

-- 3) Üye indirimi kendine yazamaz, kasa fonksiyonlarını çağıramaz
select pg_temp.hata($$insert into public.kampanya_kullanimlari (kampanya_id, uye_id) select id, auth.uid() from public.kampanyalar$$, 'row-level security');
select pg_temp.hata($$insert into public.kampanyalar (baslik, oran) values ('Sahte', 50)$$, 'row-level security');
select public.benim_qr_kodum() as qr_e \gset
select pg_temp.hata(format('select * from public.kasa_kampanyalar(%L)', :'qr_e'), 'YETKI_YOK');
select pg_temp.hata(format('select public.kampanya_uygula(%L, (select id from public.kampanyalar where tur = %L))', :'qr_e', 'hosgeldin'), 'YETKI_YOK');

-- 4) Kasa: QR okutulur, hoş geldin bir kez uygulanır
select pg_temp.olarak('00000000-0000-0000-0000-0000000000c1');
select pg_temp.esit((select uye_ad from public.kasa_kampanyalar(:'qr_e') limit 1), 'Elif Y.', 'kasada kısa ad görünür');
select pg_temp.esit((select count(*) from public.kasa_kampanyalar(:'qr_e')), 1::bigint, 'kasada geçerli kampanyalar listelenir');
select id as hosgeldin from public.kampanyalar where tur = 'hosgeldin' \gset
select pg_temp.esit((public.kampanya_uygula(:'qr_e', :'hosgeldin') is not null), true, 'hoş geldin indirimi uygulanır');
select pg_temp.hata(format('select public.kampanya_uygula(%L, %L)', :'qr_e', :'hosgeldin'), 'KULLANILDI');
select pg_temp.esit((select kullanildi is not null from public.kasa_kampanyalar(:'qr_e') where tur = 'hosgeldin'), true, 'kasada kullanıldı görünür');
select pg_temp.hata(format('select public.kampanya_uygula(%L, %L)', :'qr_e' || 'x', :'hosgeldin'), 'QR_GECERSIZ');
select pg_temp.hata($$insert into public.kampanyalar (baslik, oran) values ('Kasiyer kampanyası', 10)$$, 'row-level security');

select pg_temp.olarak('00000000-0000-0000-0000-0000000000f1');
select pg_temp.esit((select kullanildi is not null from public.benim_kampanyalarim() where tur = 'hosgeldin'), true, 'üye kullanıldığını görür');
select pg_temp.esit((select count(*) from public.kampanya_kullanimlari), 1::bigint, 'üye kendi kullanımını görür');

-- Başka üye kendi hoş geldin indirimini ayrıca kullanabilir
select pg_temp.olarak('00000000-0000-0000-0000-0000000000f2');
select pg_temp.esit((select ad from public.uye_ol('Can Demir')), 'Can Demir', 'ikinci üye e-postayla üye olur');
select public.benim_qr_kodum() as qr_f \gset
select pg_temp.esit((select count(*) from public.kampanya_kullanimlari), 0::bigint, 'üye başkasının kullanımını göremez');
select pg_temp.olarak('00000000-0000-0000-0000-0000000000c1');
select pg_temp.esit((public.kampanya_uygula(:'qr_f', :'hosgeldin') is not null), true, 'her üye kendi hoş geldin indirimini alır');

-- 5) Yönetici kampanyası: sınırsız kullanım, süresi dolan uygulanmaz
select pg_temp.olarak('00000000-0000-0000-0000-0000000000d1');
insert into public.kampanyalar (baslik, oran, kapsam, bitis, tek_kullanim)
  values ('Bugün patiseride %5', 5, 'Yalnız patiseri', now() + interval '4 hours', false);
insert into public.kampanyalar (baslik, oran, baslangic, bitis, tek_kullanim)
  values ('Geçen haftanın kampanyası', 10, now() - interval '8 days', now() - interval '1 day', true);
select pg_temp.hata($$insert into public.kampanyalar (tur, baslik, oran) values ('hosgeldin', 'İkinci hoş geldin', 5)$$, 'duplicate key');
select pg_temp.hata($$insert into public.kampanyalar (baslik, oran) values ('Çok büyük', 90)$$, 'check');
reset role;
select id as patiseri from public.kampanyalar where baslik = 'Bugün patiseride %5' \gset
select id as eski from public.kampanyalar where baslik = 'Geçen haftanın kampanyası' \gset
select pg_temp.olarak('00000000-0000-0000-0000-0000000000c1');
select pg_temp.esit((select count(*) from public.kasa_kampanyalar(:'qr_e')), 2::bigint, 'süresi dolan kampanya kasada listelenmez');
select pg_temp.esit((public.kampanya_uygula(:'qr_e', :'patiseri') is not null), true, 'sınırsız kampanya uygulanır');
select pg_temp.esit((public.kampanya_uygula(:'qr_e', :'patiseri') is not null), true, 'sınırsız kampanya ikinci kez uygulanır');
select pg_temp.hata(format('select public.kampanya_uygula(%L, %L)', :'qr_e', :'eski'), 'KAMPANYA_GECERSIZ');
select pg_temp.olarak(null);
select pg_temp.esit((select count(*) from public.kampanyalar), 2::bigint, 'anonim süresi dolan kampanyayı görmez');

-- 6) Hesap silinince kullanımlar da silinir
select pg_temp.olarak('00000000-0000-0000-0000-0000000000f1');
select public.hesabimi_sil();
reset role;
select pg_temp.esit((select count(*) from public.kampanya_kullanimlari where uye_id = '00000000-0000-0000-0000-0000000000f1'), 0::bigint, 'hesap silinince kullanım kayıtları silinir');
\echo 'KAMPANYA TESTLERİ GEÇTİ'
