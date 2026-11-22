-- Yerel test için Supabase'in auth şeması ve rollerinin en küçük taklidi.
-- Gerçek Supabase projesinde ÇALIŞTIRILMAZ.
create schema if not exists auth;
create schema if not exists extensions;
create table auth.users (id uuid primary key, phone text, email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
grant usage on schema public, auth, extensions to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase varsayılanı: public tablolarına tam yetki, RLS süzer
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
