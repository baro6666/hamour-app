# Hamour

Hamour (pâtisserie · brasserie · bistro, Beykoz) müşteri uygulaması, kasa ekranı ve yönetim paneli.
Bu depo yalnız Hamour'a aittir; Fincosto'dan bağımsızdır. İskelet butter uygulamasından alınmıştır.

- Kapsam ve kararlar: [`docs/kapsam.md`](docs/kapsam.md)
- Müşteri uygulaması: [`app/`](app) (Expo, iPhone + Android)
- Veritabanı ve kurallar: [`supabase/`](supabase)
- Kasa ve yönetim paneli: [`panel/`](panel)

## Uygulamayı denemek

```bash
cd app
npm install
npx expo start
```

Supabase bilgileri `app/.env`'de yoksa uygulama örnek veriyle açılır (SMS kodu: 123456).

## Veritabanı testleri

```bash
supabase/tests/calistir.sh
```
