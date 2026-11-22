#!/usr/bin/env bash
# Şemayı geçici bir PostgreSQL'de (Supabase taklidiyle) kurar ve kural testlerini çalıştırır.
set -euo pipefail
cd "$(dirname "$0")/../.."
PGBIN=${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin | tail -1)}
DIZIN=$(mktemp -d)
trap '"$PGBIN/pg_ctl" -D "$DIZIN/veri" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIZIN"' EXIT
if [ "$(id -u)" = 0 ]; then chown -R postgres "$DIZIN"; KIM="sudo -u postgres"; else KIM=""; fi
$KIM "$PGBIN/initdb" -D "$DIZIN/veri" -U postgres -A trust >/dev/null
$KIM "$PGBIN/pg_ctl" -D "$DIZIN/veri" -o "-k $DIZIN -p 54329 -c listen_addresses=''" -l "$DIZIN/log" -w start >/dev/null
PSQL="psql -h $DIZIN -p 54329 -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
$PSQL -f supabase/tests/supabase_taklit.sql
for f in supabase/migrations/*.sql; do $PSQL -f "$f"; done
$PSQL -f supabase/tests/kurallar.test.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /' | grep -v '^$'

# Başlangıç verisi temiz bir veritabanına sorunsuz yükleniyor mu?
psql -h "$DIZIN" -p 54329 -U postgres -d postgres -q -c 'create database tohum'
PSQL2="psql -h $DIZIN -p 54329 -U postgres -d tohum -v ON_ERROR_STOP=1 -q"
$PSQL2 -f supabase/tests/supabase_taklit.sql
for f in supabase/migrations/*.sql; do $PSQL2 -f "$f"; done
$PSQL2 -f supabase/seed.sql
echo "Başlangıç verisi yüklendi: $($PSQL2 -tAc 'select count(*) from public.urunler') ürün"
