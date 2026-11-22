-- Hamour Kartı: e-posta ile üyelik, kasada okutulan QR ile hoş geldin indirimi ve kampanyalar.
-- QR imzası (benim_qr_kodum / _qr_coz) başlangıç şemasındaki gibi: her dakika değişir, ekran görüntüsü işe yaramaz.
-- Kampanya kullanımı yalnız SECURITY DEFINER fonksiyonlarla yazılır; istemci tabloya doğrudan yazamaz.

-- ─────────────────────────── Üyelik: e-posta ───────────────────────────
alter table public.uyeler add column if not exists eposta text;

-- Başlangıç şemasındaki uye_ol ile aynı (davet, kart satırı), yalnız e-posta da yazılır.
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
  insert into public.uyeler (id, ad, telefon, eposta, dogum_gunu, davet_eden, kampanya_izni, kampanya_izni_tarih)
  values (auth.uid(), nullif(trim(p_ad), ''),
          (select u.phone from auth.users u where u.id = auth.uid()),
          (select lower(u.email) from auth.users u where u.id = auth.uid()),
          p_dogum_gunu, v_davet, coalesce(p_kampanya_izni, false),
          case when p_kampanya_izni then now() end)
  on conflict (id) do update set ad = coalesce(excluded.ad, public.uyeler.ad)
  returning * into v_uye;
  insert into public.kartlar (uye_id) values (auth.uid()) on conflict do nothing;
  return v_uye;
end $$;

-- ─────────────────────────── Kampanyalar ───────────────────────────
create table public.kampanyalar (
  id uuid primary key default gen_random_uuid(),
  tur text not null default 'kampanya' check (tur in ('hosgeldin', 'kampanya')),
  baslik text not null,                       -- 'Bugün patiseride %5 sizi bekliyor'
  metin text,
  oran int not null check (oran between 1 and 50),      -- indirim yüzdesi
  kapsam text,                                -- 'Alkollü içecekler hariç', 'Yalnız patiseri'
  baslangic timestamptz not null default now(),
  bitis timestamptz,                          -- null: süresiz
  tek_kullanim boolean not null default true, -- üye başına bir kez
  aktif boolean not null default true,
  olusturan uuid references auth.users (id) on delete set null,
  olusturma timestamptz not null default now(),
  check (bitis is null or bitis > baslangic)
);
-- Hoş geldin indirimi tek olur
create unique index kampanyalar_tek_hosgeldin on public.kampanyalar ((true)) where tur = 'hosgeldin';

create table public.kampanya_kullanimlari (
  id bigint generated always as identity primary key,
  kampanya_id uuid not null references public.kampanyalar (id) on delete cascade,
  uye_id uuid not null references public.uyeler (id) on delete cascade,
  personel_id uuid references auth.users (id) on delete set null,
  sube_id uuid references public.subeler (id) on delete set null,
  zaman timestamptz not null default now()
);
create index kampanya_kullanimlari_uye on public.kampanya_kullanimlari (uye_id, kampanya_id);

-- Uygulamayı indirene ilk ziyarette %5 (Hamour'un kararı, 22.11.2026)
insert into public.kampanyalar (tur, baslik, metin, oran, kapsam, tek_kullanim)
values ('hosgeldin', 'Hoş geldin indirimi', 'Uygulamayı indirdiğiniz için ilk ziyaretinizde %5 indirim.', 5,
        'Alkollü içecekler hariç', true);

create or replace function public._kampanya_gecerli(k public.kampanyalar) returns boolean
language sql stable set search_path = '' as $$
  select k.aktif and k.baslangic <= now() and (k.bitis is null or k.bitis > now());
$$;

-- Uygulama: geçerli kampanyalar ve benim kullanıp kullanmadığım
create or replace function public.benim_kampanyalarim()
returns table (id uuid, tur text, baslik text, metin text, oran int, kapsam text, bitis timestamptz,
               tek_kullanim boolean, kullanildi timestamptz)
language sql stable security definer set search_path = '' as $$
  select k.id, k.tur, k.baslik, k.metin, k.oran, k.kapsam, k.bitis, k.tek_kullanim,
         (select max(x.zaman) from public.kampanya_kullanimlari x where x.kampanya_id = k.id and x.uye_id = auth.uid())
  from public.kampanyalar k
  where public._kampanya_gecerli(k)
  order by (k.tur = 'hosgeldin') desc, k.baslangic desc;
$$;

-- Kasa: QR okutulunca üye (kısa ad) ve kullanabileceği kampanyalar
create or replace function public.kasa_kampanyalar(p_kod text)
returns table (uye_ad text, kampanya_id uuid, tur text, baslik text, oran int, kapsam text,
               tek_kullanim boolean, kullanildi timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare v_uye uuid;
begin
  if not public.personel_mi() then raise exception 'YETKI_YOK'; end if;
  v_uye := public._qr_coz(p_kod);
  return query
    select coalesce(split_part(u.ad, ' ', 1) || coalesce(' ' || left(nullif(split_part(u.ad, ' ', 2), ''), 1) || '.', ''), 'Üye'),
           k.id, k.tur, k.baslik, k.oran, k.kapsam, k.tek_kullanim,
           (select max(x.zaman) from public.kampanya_kullanimlari x where x.kampanya_id = k.id and x.uye_id = v_uye)
    from public.uyeler u
    cross join public.kampanyalar k
    where u.id = v_uye and public._kampanya_gecerli(k)
    order by (k.tur = 'hosgeldin') desc, k.baslangic desc;
end $$;

-- Kasa: indirimi uygula (kasiyer kasada indirimi yaptıktan sonra). Tek kullanımlıkta ikinci kez → KULLANILDI.
create or replace function public.kampanya_uygula(p_kod text, p_kampanya uuid)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_uye uuid;
  v_k public.kampanyalar;
  v_zaman timestamptz;
begin
  if not public.personel_mi() then raise exception 'YETKI_YOK'; end if;
  v_uye := public._qr_coz(p_kod);
  select * into v_k from public.kampanyalar where id = p_kampanya for update; -- aynı anda iki kasa: sırayla
  if not found or not public._kampanya_gecerli(v_k) then raise exception 'KAMPANYA_GECERSIZ'; end if;
  if v_k.tek_kullanim and exists (select 1 from public.kampanya_kullanimlari
                                  where kampanya_id = v_k.id and uye_id = v_uye) then
    raise exception 'KULLANILDI';
  end if;
  insert into public.kampanya_kullanimlari (kampanya_id, uye_id, personel_id, sube_id)
  values (v_k.id, v_uye, auth.uid(), (select p.sube_id from public.personel p where p.kullanici_id = auth.uid()))
  returning zaman into v_zaman;
  return v_zaman;
end $$;

-- ─────────────────────────── RLS ve yetkiler ───────────────────────────
alter table public.kampanyalar enable row level security;
alter table public.kampanya_kullanimlari enable row level security;

create policy "kampanyalar okunur" on public.kampanyalar for select
  using (public._kampanya_gecerli(kampanyalar) or public.yonetici_mi());
create policy "kampanyalar yonetici" on public.kampanyalar for all
  using (public.yonetici_mi()) with check (public.yonetici_mi());
create policy "kullanim kendi" on public.kampanya_kullanimlari for select
  using (uye_id = auth.uid() or public.yonetici_mi());
-- kampanya_kullanimlari'na insert / update / delete politikası yok: yalnız kampanya_uygula yazar.

revoke execute on function public.benim_kampanyalarim() from public, anon;
revoke execute on function public.kasa_kampanyalar(text) from public, anon;
revoke execute on function public.kampanya_uygula(text, uuid) from public, anon;
grant execute on function public.benim_kampanyalarim(), public.kasa_kampanyalar(text), public.kampanya_uygula(text, uuid)
  to authenticated;
grant execute on function public._kampanya_gecerli(public.kampanyalar) to anon, authenticated;
