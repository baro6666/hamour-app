-- Hamour — başlangıç şeması (Supabase / PostgreSQL)
-- Sipariş ve ödeme yok: menü, duyurular, üyelik, kahve kartı (damga), ön sipariş talebi.
-- Yetki: müşteri (auth kullanıcısı + uyeler satırı), personel (kasiyer | yonetici).
-- Damga ve bedava kahve yalnız SECURITY DEFINER fonksiyonlarla değişir; tablolara doğrudan yazılamaz.

create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────── Tablolar ───────────────────────────

create table public.subeler (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  adres text,
  telefon text,
  calisma_saatleri text,
  enlem numeric(9, 6),
  boylam numeric(9, 6),
  aktif boolean not null default true,
  olusturma timestamptz not null default now()
);

create table public.personel (
  kullanici_id uuid primary key references auth.users (id) on delete cascade,
  ad text not null,
  rol text not null check (rol in ('kasiyer', 'yonetici')),
  sube_id uuid references public.subeler (id),
  aktif boolean not null default true,
  olusturma timestamptz not null default now()
);

create table public.uyeler (
  id uuid primary key references auth.users (id) on delete cascade,
  ad text,
  telefon text unique,
  dogum_gunu date,
  davet_kodu text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  davet_eden uuid references public.uyeler (id) on delete set null,
  bildirim_firin boolean not null default true,
  bildirim_favori boolean not null default true,
  kampanya_izni boolean not null default false,        -- ticari ileti (İYS)
  kampanya_izni_tarih timestamptz,
  push_token text,
  olusturma timestamptz not null default now()
);

create table public.kategoriler (
  id text primary key,                                  -- 'kahve', 'tatli', ...
  ad text not null,
  sira int not null default 0,
  damga_verir boolean not null default false,
  gorunur boolean not null default true
);

create table public.urunler (
  id uuid primary key default gen_random_uuid(),
  kerzz_kodu text unique,
  kategori_id text not null references public.kategoriler (id),
  ad text not null,
  ad_en text,
  aciklama text,
  fiyat numeric(10, 2),
  alerjenler text,
  kalori int,
  foto_url text,
  eslik_urun_id uuid references public.urunler (id) on delete set null,
  vitrin_durumu text not null default 'normal' check (vitrin_durumu in ('normal', 'son', 'firin', 'tukendi')),
  vitrin_notu text,                                     -- ör. 'Son 3 dilim'
  vitrin_guncelleme timestamptz,
  on_siparis boolean not null default false,
  gorunur boolean not null default true,
  sira int not null default 0,
  olusturma timestamptz not null default now()
);

create table public.favoriler (
  uye_id uuid not null references public.uyeler (id) on delete cascade,
  urun_id uuid not null references public.urunler (id) on delete cascade,
  olusturma timestamptz not null default now(),
  primary key (uye_id, urun_id)
);

create table public.duyurular (
  id uuid primary key default gen_random_uuid(),
  tur text not null check (tur in ('firin', 'vitrin', 'kampanya', 'yeni', 'etkinlik', 'kart')),
  baslik text not null,
  metin text,
  urun_id uuid references public.urunler (id) on delete set null,
  yayin_zamani timestamptz not null default now(),
  bitis timestamptz,
  bildirim boolean not null default false,
  olusturan uuid references auth.users (id) on delete set null,
  olusturma timestamptz not null default now()
);

create table public.duyuru_okundu (
  uye_id uuid not null references public.uyeler (id) on delete cascade,
  duyuru_id uuid not null references public.duyurular (id) on delete cascade,
  primary key (uye_id, duyuru_id)
);

-- Tek satırlık kahve kartı kuralı
create table public.kart_ayar (
  id int primary key default 1 check (id = 1),
  hedef_damga int not null default 8 check (hedef_damga between 3 and 15),
  dogum_gunu boolean not null default true,
  mevsim_karti boolean not null default true,
  davet boolean not null default true,
  gizli_menu boolean not null default true,
  tekrar_dakika int not null default 10,                -- aynı üyeye bu süre içinde 2. damga = yönetici onayı
  guncelleme timestamptz not null default now()
);
insert into public.kart_ayar (id) values (1);

-- Üyenin kart durumu (yalnız fonksiyonlarla değişir)
create table public.kartlar (
  uye_id uuid primary key references public.uyeler (id) on delete cascade,
  damga int not null default 0 check (damga >= 0),
  hak int not null default 0 check (hak >= 0),          -- kullanılmamış bedava kahve
  kullanilan_bedava int not null default 0,
  toplam_damga int not null default 0,
  kart_doldu int not null default 0,                    -- gizli menü: > 0 ise açık
  guncelleme timestamptz not null default now()
);

create table public.damga_hareketleri (
  id bigint generated always as identity primary key,
  uye_id uuid not null references public.uyeler (id) on delete cascade,
  tur text not null check (tur in ('damga', 'bedava', 'davet', 'duzeltme')),
  adet int not null,
  sube_id uuid references public.subeler (id),
  personel_id uuid references auth.users (id) on delete set null,
  onaylayan uuid references auth.users (id) on delete set null,
  olusturma timestamptz not null default now()
);
create index damga_hareketleri_uye on public.damga_hareketleri (uye_id, olusturma desc);
create index damga_hareketleri_tarih on public.damga_hareketleri (olusturma desc);

create table public.puanlamalar (
  id bigint generated always as identity primary key,
  uye_id uuid not null references public.uyeler (id) on delete cascade,
  hareket_id bigint not null unique references public.damga_hareketleri (id) on delete cascade,
  puan int not null check (puan between 1 and 5),
  notu text,
  durum text not null default 'yeni' check (durum in ('yeni', 'donuldu')),
  olusturma timestamptz not null default now()
);

create table public.on_siparis_talepleri (
  id bigint generated always as identity primary key,
  uye_id uuid not null references public.uyeler (id) on delete cascade,
  urun_id uuid not null references public.urunler (id),
  adet int not null default 1 check (adet between 1 and 20),
  istenen_tarih date,
  notu text,
  durum text not null default 'yeni' check (durum in ('yeni', 'arandi', 'onaylandi', 'iptal', 'teslim')),
  olusturma timestamptz not null default now()
);

-- QR imzası için sır: RLS açık, politika yok → yalnız SECURITY DEFINER fonksiyonlar okur
create table public.gizli_ayar (
  anahtar text primary key,
  deger text not null
);
insert into public.gizli_ayar values ('qr_sir', encode(extensions.gen_random_bytes(32), 'hex'));

-- ─────────────────────────── Yardımcılar ───────────────────────────

create or replace function public.personel_mi() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.personel p where p.kullanici_id = auth.uid() and p.aktif);
$$;

create or replace function public.yonetici_mi() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.personel p where p.kullanici_id = auth.uid() and p.aktif and p.rol = 'yonetici');
$$;

-- Yeni üye: uyeler + kartlar satırı birlikte açılır (uygulama ilk girişte çağırır)
create or replace function public.uye_ol(p_ad text, p_dogum_gunu date default null, p_davet_kodu text default null,
                                         p_kampanya_izni boolean default false)
returns public.uyeler
language plpgsql security definer set search_path = '' as $$
declare
  v_uye public.uyeler;
  v_davet uuid;
begin
  if auth.uid() is null then raise exception 'OTURUM_YOK'; end if;
  if p_davet_kodu is not null and length(trim(p_davet_kodu)) > 0 then
    select id into v_davet from public.uyeler where davet_kodu = upper(trim(p_davet_kodu)) and id <> auth.uid();
  end if;
  insert into public.uyeler (id, ad, telefon, dogum_gunu, davet_eden, kampanya_izni, kampanya_izni_tarih)
  values (auth.uid(), nullif(trim(p_ad), ''),
          (select u.phone from auth.users u where u.id = auth.uid()),
          p_dogum_gunu, v_davet, coalesce(p_kampanya_izni, false),
          case when p_kampanya_izni then now() end)
  on conflict (id) do update set ad = coalesce(excluded.ad, public.uyeler.ad)
  returning * into v_uye;
  insert into public.kartlar (uye_id) values (auth.uid()) on conflict do nothing;
  return v_uye;
end $$;

-- ─────────────────────────── QR kodu ───────────────────────────
-- Kod: <uye_id>.<dakika>.<imza16>; o dakika ve bir öncekinde geçerli (en çok ~2 dk).
-- Ekran görüntüsüyle sonradan damga alınamaz.

create or replace function public._qr_imza(p_uye uuid, p_dakika bigint) returns text
language sql stable security definer set search_path = '' as $$
  select substr(encode(extensions.hmac(p_uye::text || '.' || p_dakika::text,
                                       (select deger from public.gizli_ayar where anahtar = 'qr_sir'), 'sha256'), 'hex'), 1, 16);
$$;
revoke all on function public._qr_imza(uuid, bigint) from public, anon, authenticated;

create or replace function public.benim_qr_kodum() returns text
language plpgsql stable security definer set search_path = '' as $$
declare v_dakika bigint := floor(extract(epoch from now()) / 60);
begin
  if not exists (select 1 from public.uyeler where id = auth.uid()) then raise exception 'UYE_DEGIL'; end if;
  return auth.uid()::text || '.' || v_dakika::text || '.' || public._qr_imza(auth.uid(), v_dakika);
end $$;

create or replace function public._qr_coz(p_kod text) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_parca text[] := string_to_array(coalesce(p_kod, ''), '.');
  v_uye uuid;
  v_dakika bigint;
  v_simdi bigint := floor(extract(epoch from now()) / 60);
begin
  if array_length(v_parca, 1) <> 3 then raise exception 'QR_GECERSIZ'; end if;
  begin
    v_uye := v_parca[1]::uuid;
    v_dakika := v_parca[2]::bigint;
  exception when others then raise exception 'QR_GECERSIZ';
  end;
  if v_dakika not in (v_simdi, v_simdi - 1) then raise exception 'QR_SURESI_DOLDU'; end if;
  if public._qr_imza(v_uye, v_dakika) <> v_parca[3] then raise exception 'QR_GECERSIZ'; end if;
  if not exists (select 1 from public.uyeler where id = v_uye) then raise exception 'UYE_YOK'; end if;
  return v_uye;
end $$;
revoke all on function public._qr_coz(text) from public, anon, authenticated;

-- ─────────────────────────── Kasa fonksiyonları ───────────────────────────

-- Kasiyer QR'ı okuttuğunda: üyenin adı (kısaltılmış) ve kart durumu
create or replace function public.kasa_uye_bul(p_kod text)
returns table (uye_id uuid, ad text, damga int, hak int, hedef int, son_ziyaret timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare v_uye uuid;
begin
  if not public.personel_mi() then raise exception 'YETKI_YOK'; end if;
  v_uye := public._qr_coz(p_kod);
  return query
    select u.id,
           -- Kasada tam ad gösterilmez: "Ayşe K."
           coalesce(split_part(u.ad, ' ', 1) || coalesce(' ' || left(nullif(split_part(u.ad, ' ', 2), ''), 1) || '.', ''), 'Üye'),
           k.damga, k.hak, a.hedef_damga,
           (select max(h.olusturma) from public.damga_hareketleri h where h.uye_id = u.id and h.tur = 'damga')
    from public.uyeler u
    join public.kartlar k on k.uye_id = u.id
    cross join public.kart_ayar a
    where u.id = v_uye;
end $$;

-- Damga ver: QR + adet. Aynı üyeye tekrar_dakika içinde ikinci damga yalnız yöneticiyle (p_zorla).
create or replace function public.damga_ver(p_kod text, p_adet int, p_zorla boolean default false)
returns table (damga int, hak int, hedef int, yeni_hak int)
language plpgsql security definer set search_path = '' as $$
declare
  v_uye uuid;
  v_ayar public.kart_ayar;
  v_kart public.kartlar;
  v_toplam int;
  v_yeni_hak int;
  v_sube uuid;
  v_ilk boolean;
  v_davet uuid;
  v_hak_once int;
begin
  if not public.personel_mi() then raise exception 'YETKI_YOK'; end if;
  if p_adet is null or p_adet < 1 or p_adet > 10 then raise exception 'ADET_GECERSIZ'; end if;
  v_uye := public._qr_coz(p_kod);
  select * into v_ayar from public.kart_ayar where id = 1;
  select p.sube_id into v_sube from public.personel p where p.kullanici_id = auth.uid();

  if exists (select 1 from public.damga_hareketleri h
             where h.uye_id = v_uye and h.tur = 'damga'
               and h.olusturma > now() - make_interval(mins => v_ayar.tekrar_dakika)) then
    if not (p_zorla and public.yonetici_mi()) then raise exception 'ONAY_GEREKLI'; end if;
  end if;

  v_ilk := not exists (select 1 from public.damga_hareketleri h where h.uye_id = v_uye and h.tur = 'damga');

  select * into v_kart from public.kartlar where uye_id = v_uye for update;
  v_hak_once := v_kart.hak;
  v_toplam := v_kart.damga + p_adet;
  v_yeni_hak := v_toplam / v_ayar.hedef_damga;
  update public.kartlar k set
    damga = v_toplam % v_ayar.hedef_damga,
    hak = k.hak + v_yeni_hak,
    toplam_damga = k.toplam_damga + p_adet,
    kart_doldu = k.kart_doldu + v_yeni_hak,
    guncelleme = now()
  where k.uye_id = v_uye
  returning * into v_kart;

  insert into public.damga_hareketleri (uye_id, tur, adet, sube_id, personel_id, onaylayan)
  values (v_uye, 'damga', p_adet, v_sube, auth.uid(), case when p_zorla then auth.uid() end);

  -- Arkadaşını getir: davet edilenin ilk damgasında ikisine de 1 damga
  if v_ilk and v_ayar.davet then
    select davet_eden into v_davet from public.uyeler where id = v_uye;
    if v_davet is not null then
      perform public._davet_damgasi(v_uye, v_sube);
      perform public._davet_damgasi(v_davet, v_sube);
      select * into v_kart from public.kartlar where uye_id = v_uye;
    end if;
  end if;

  return query select v_kart.damga, v_kart.hak, v_ayar.hedef_damga, v_kart.hak - v_hak_once;
end $$;

create or replace function public._davet_damgasi(p_uye uuid, p_sube uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_hedef int := (select hedef_damga from public.kart_ayar where id = 1);
begin
  insert into public.kartlar (uye_id) values (p_uye) on conflict do nothing;
  update public.kartlar k set
    hak = k.hak + (k.damga + 1) / v_hedef,
    kart_doldu = k.kart_doldu + (k.damga + 1) / v_hedef,
    damga = (k.damga + 1) % v_hedef,
    toplam_damga = k.toplam_damga + 1,
    guncelleme = now()
  where k.uye_id = p_uye;
  insert into public.damga_hareketleri (uye_id, tur, adet, sube_id, personel_id)
  values (p_uye, 'davet', 1, p_sube, auth.uid());
end $$;
revoke all on function public._davet_damgasi(uuid, uuid) from public, anon, authenticated;

create or replace function public.bedava_kullandir(p_kod text)
returns table (damga int, hak int)
language plpgsql security definer set search_path = '' as $$
declare
  v_uye uuid;
  v_kart public.kartlar;
begin
  if not public.personel_mi() then raise exception 'YETKI_YOK'; end if;
  v_uye := public._qr_coz(p_kod);
  update public.kartlar k set hak = k.hak - 1, kullanilan_bedava = k.kullanilan_bedava + 1, guncelleme = now()
  where k.uye_id = v_uye and k.hak > 0
  returning * into v_kart;
  if not found then raise exception 'HAK_YOK'; end if;
  insert into public.damga_hareketleri (uye_id, tur, adet, sube_id, personel_id)
  values (v_uye, 'bedava', 1, (select p.sube_id from public.personel p where p.kullanici_id = auth.uid()), auth.uid());
  return query select v_kart.damga, v_kart.hak;
end $$;

-- Kasiyerin bugünkü damga sayısı (ekranın üst köşesi)
create or replace function public.kasa_bugun() returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(adet), 0)::int from public.damga_hareketleri
  where personel_id = auth.uid() and tur = 'damga'
    and olusturma >= date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
$$;

-- ─────────────────────────── Müşteri fonksiyonları ───────────────────────────

-- Son damga ziyaretini puanla (yalnız kendi hareketi, bir kez)
create or replace function public.ziyaret_puanla(p_hareket bigint, p_puan int, p_not text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.damga_hareketleri h where h.id = p_hareket and h.uye_id = auth.uid() and h.tur = 'damga') then
    raise exception 'HAREKET_YOK';
  end if;
  insert into public.puanlamalar (uye_id, hareket_id, puan, notu) values (auth.uid(), p_hareket, p_puan, nullif(trim(p_not), ''))
  on conflict (hareket_id) do update set puan = excluded.puan, notu = excluded.notu;
end $$;

-- App Store şartı: hesabı silme. Hareket kayıtları da silinir (cascade).
create or replace function public.hesabimi_sil() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'OTURUM_YOK'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ─────────────────────────── RLS ───────────────────────────

alter table public.subeler enable row level security;
alter table public.personel enable row level security;
alter table public.uyeler enable row level security;
alter table public.kategoriler enable row level security;
alter table public.urunler enable row level security;
alter table public.favoriler enable row level security;
alter table public.duyurular enable row level security;
alter table public.duyuru_okundu enable row level security;
alter table public.kart_ayar enable row level security;
alter table public.kartlar enable row level security;
alter table public.damga_hareketleri enable row level security;
alter table public.puanlamalar enable row level security;
alter table public.on_siparis_talepleri enable row level security;
alter table public.gizli_ayar enable row level security;

-- Herkese açık okuma (giriş yapmadan menü görülür)
create policy "subeler okunur" on public.subeler for select using (aktif or public.yonetici_mi());
create policy "kategoriler okunur" on public.kategoriler for select using (gorunur or public.yonetici_mi());
create policy "urunler okunur" on public.urunler for select using (gorunur or public.yonetici_mi());
create policy "duyurular okunur" on public.duyurular for select
  using ((yayin_zamani <= now() and (bitis is null or bitis > now())) or public.yonetici_mi());
create policy "kart ayari okunur" on public.kart_ayar for select using (true);

-- Yönetici yazar
create policy "subeler yonetici" on public.subeler for all using (public.yonetici_mi()) with check (public.yonetici_mi());
create policy "kategoriler yonetici" on public.kategoriler for all using (public.yonetici_mi()) with check (public.yonetici_mi());
create policy "urunler yonetici" on public.urunler for all using (public.yonetici_mi()) with check (public.yonetici_mi());
create policy "duyurular yonetici" on public.duyurular for all using (public.yonetici_mi()) with check (public.yonetici_mi());
create policy "kart ayari yonetici" on public.kart_ayar for update using (public.yonetici_mi()) with check (public.yonetici_mi());
create policy "personel kendisi" on public.personel for select using (kullanici_id = auth.uid() or public.yonetici_mi());
create policy "personel yonetici" on public.personel for all using (public.yonetici_mi()) with check (public.yonetici_mi());

-- Üye kendi verisi
create policy "uye kendini okur" on public.uyeler for select using (id = auth.uid() or public.yonetici_mi());
create policy "uye kendini gunceller" on public.uyeler for update using (id = auth.uid()) with check (id = auth.uid());
create policy "favori kendi" on public.favoriler for all using (uye_id = auth.uid()) with check (uye_id = auth.uid());
create policy "okundu kendi" on public.duyuru_okundu for all using (uye_id = auth.uid()) with check (uye_id = auth.uid());
create policy "kart kendi" on public.kartlar for select using (uye_id = auth.uid() or public.yonetici_mi());
create policy "hareket kendi" on public.damga_hareketleri for select using (uye_id = auth.uid() or public.yonetici_mi());
create policy "puan kendi" on public.puanlamalar for select using (uye_id = auth.uid() or public.yonetici_mi());
create policy "puan yonetici" on public.puanlamalar for update using (public.yonetici_mi()) with check (public.yonetici_mi());
create policy "talep kendi okur" on public.on_siparis_talepleri for select using (uye_id = auth.uid() or public.yonetici_mi());
create policy "talep birakir" on public.on_siparis_talepleri for insert
  with check (uye_id = auth.uid() and durum = 'yeni'
              and exists (select 1 from public.urunler u where u.id = urun_id and u.on_siparis and u.gorunur));
create policy "talep yonetici" on public.on_siparis_talepleri for update using (public.yonetici_mi()) with check (public.yonetici_mi());

-- Üye yalnız izin ve profil alanlarını değiştirebilir (telefon, davet bilgisi değişmez)
revoke update on public.uyeler from anon, authenticated;
grant update (ad, dogum_gunu, bildirim_firin, bildirim_favori, kampanya_izni, kampanya_izni_tarih, push_token)
  on public.uyeler to authenticated;

-- Fonksiyon yetkileri
revoke execute on function public.uye_ol(text, date, text, boolean) from public, anon;
revoke execute on function public.benim_qr_kodum() from public, anon;
revoke execute on function public.kasa_uye_bul(text) from public, anon;
revoke execute on function public.damga_ver(text, int, boolean) from public, anon;
revoke execute on function public.bedava_kullandir(text) from public, anon;
revoke execute on function public.kasa_bugun() from public, anon;
revoke execute on function public.ziyaret_puanla(bigint, int, text) from public, anon;
revoke execute on function public.hesabimi_sil() from public, anon;
grant execute on function public.uye_ol(text, date, text, boolean), public.benim_qr_kodum(), public.kasa_uye_bul(text),
  public.damga_ver(text, int, boolean), public.bedava_kullandir(text), public.kasa_bugun(),
  public.ziyaret_puanla(bigint, int, text), public.hesabimi_sil(), public.personel_mi(), public.yonetici_mi()
  to authenticated;
