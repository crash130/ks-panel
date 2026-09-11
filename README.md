# KS — panel warsztatu Komputer Serwis

Panel serwisowy **KS** dla salonu [komputerserwis.pl](https://komputerserwis.pl) (Krzyż Wielkopolski). Przyjęcia, kolejka KS-####, Ofertomat (oferta wielopozycyjna + karta produktu), PDF, eksport HTML dla klienta, Google Calendar.

Produkt nazywa się **KS**. Nie używamy nazwy marketingowej palety kolorów w interfejsie.

## Wymagania

- Node.js 22+
- Docker + Docker Compose (wdrożenie na VPS) **albo** PostgreSQL 16 lokalnie
- Domena / HTTPS na produkcji (ustaw `AUTH_SECURE_COOKIES=true`)

## Szybki start (Docker) — własny serwer

```bash
git clone <to-repo> ks-panel
cd ks-panel
cp .env.example .env
# wygeneruj sekrety:
#   openssl rand -hex 32   → SESSION_SECRET
#   openssl rand -hex 32   → ENCRYPTION_KEY (64 znaki hex)
docker compose up --build
```

Otwórz [http://localhost:3000](http://localhost:3000).

- **Pusta baza (produkcja / prawdziwi klienci):** kreator `/setup` — pierwsze konto to właściciel.
- **Dane DEMO do klikania:** `SEED_DEMO_DATA=true` i `npx prisma db seed` w kontenerze aplikacji (patrz niżej). Nie mieszaj DEMO z prawdziwymi danymi klientów.

```bash
docker compose exec app npx prisma db seed
```

(`SEED_DEMO_DATA` musi być `true` w środowisku kontenera.)

## Start lokalny (bez Docker)

1. Uruchom PostgreSQL i ustaw `DATABASE_URL` w `.env` (skopiuj `.env.example`).
2. `npm install`
3. `npx prisma migrate deploy`
4. `npm run dev` → [http://localhost:3000](http://localhost:3000)

Pusty start: wejdź na `/setup`.  
Seed DEMO: `SEED_DEMO_DATA=true npm run db:seed`.

Konto właściciela z CLI (bez kreatora):

```bash
OWNER_EMAIL=ty@komputerserwis.pl OWNER_PASSWORD='długie-hasło' OWNER_NAME='Damian' npm run create-owner
```

## Konta DEMO (tylko seed)

Etykieta **DEMO** — hasła wyłącznie do testów, nie na produkcję z danymi klientów.

| Rola | E-mail | Hasło |
|------|--------|--------|
| Właściciel | `wlasciciel@demo.ks.local` | `DEMO-Wlasciciel-2026!` |
| Recepcja | `recepcja@demo.ks.local` | `DEMO-Recepcja-2026!` |
| Technik | `marek@demo.ks.local` / `tomek@demo.ks.local` | `DEMO-Technik-2026!` |

Seed **nie wstawia PIN-u urządzenia do frontendu**. Ewentualny PIN jest tylko w bazie, w postaci zaszyfrowanej. W buildzie produkcyjnym nie ma „demo PIN”.

## Google Calendar

Bez `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` terminy **zapisują się lokalnie**. Panel pokazuje status „niepołączony”. **Aplikacja nigdy nie udaje udanej synchronizacji.**

1. W [Google Cloud Console](https://console.cloud.google.com/) utwórz projekt OAuth (typ: aplikacja internetowa).
2. Zakresy: `https://www.googleapis.com/auth/calendar.events` oraz e-mail konta.
3. Authorized redirect URI: `https://twoja-domena/api/calendar/callback` (lokalnie: `http://localhost:3000/api/calendar/callback`).
4. W `.env`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://twoja-domena/api/calendar/callback
GOOGLE_CALENDAR_ID=primary
APP_URL=https://twoja-domena
```

5. W panelu: **Kalendarz → Połącz Google Calendar**.
6. Zapis przyjęcia z terminem odbioru od razu próbuje utworzyć/zaktualizować wydarzenie.
7. Przycisk **Sync z Google** robi synchronizację dwukierunkową (lokalne → Google i wydarzenia z tagiem KS ← Google).

W testach automatycznych: `GOOGLE_MOCK=true` (bez sieci).

## Bezpieczeństwo

- Hasła: bcrypt (koszt 12).
- Sesje: losowy token w ciasteczku **httpOnly**, `SameSite=Lax`, `Secure` gdy `AUTH_SECURE_COOKIES=true`. W bazie trzymany jest skrót SHA-256 tokenu.
- CSRF: sprawdzane `Origin` + ciasteczko CSRF na mutacjach.
- Logowanie: limit 5 nieudanych prób / 15 min (e-mail lub IP).
- PIN i hasło urządzenia oraz tokeny Google: AES-256-GCM (`ENCRYPTION_KEY`).
- Podgląd PIN/hasła: wpis w dzienniku audytu.
- Nagłówki: nosniff, frame, referrer, permissions-policy, CSP; HSTS przy `AUTH_SECURE_COOKIES=true`.
- Role: właściciel / recepcja / technik.

### Kopie zapasowe

Na VPS (Docker):

```bash
docker compose exec db pg_dump -U ks ks_panel | gzip > ks-$(date +%F).sql.gz
```

Przywracanie:

```bash
gunzip -c ks-2026-09-11.sql.gz | docker compose exec -T db psql -U ks ks_panel
```

Katalog `uploads/` (zdjęcia ofert) kopiuj razem z dumpem. Przechowuj dump **poza** serwerem (S3, inny VPS, dysk). Szyfruj archiwum jeśli zawiera dane klientów.

Rotacja: codzienny dump + retencja 14–30 dni. Po incydencie: nowy `SESSION_SECRET` (wyloguje wszystkich) i recenzja `AuditLog`.

## Ofertomat

- **Wielopozycyjna** — tabela SKU / usługi / monitoring, PDF.
- **Karta produktu** — styl x-kom / Media Expert: galeria, parametry, akordeon specyfikacji, cena.
- **Wklej specyfikację** + **Rozbij do tabeli** — parser `Klucz: wartość` (także TSV i pary w kolejnych liniach).
- Eksport HTML dla klienta: bez menu panelu, slider zdjęć, telefon w stopce. Publiczny podgląd `/oferta/<token>`.

## Testy

```bash
npm test          # Vitest: parser + auth/jobs
npx playwright install chromium
npm run test:e2e  # logowanie, Ofertomat, viewport 390×844
```

Testy podnoszą tymczasowy Postgres (embedded), chyba że ustawisz `KS_USE_EXISTING_DB=true` i `DATABASE_URL`.

## Stos

Next.js (App Router) · TypeScript · PostgreSQL · Prisma · sesje po stronie serwera · Lucide · pdfkit · Google APIs.

## Kontakt salonu (zablokowane w brandzie)

ul. Mickiewicza 6, 64-761 Krzyż Wielkopolski · tel. 505 825 047 · sklep@komputerserwis.info · codziennie 11:00–17:00 · zasięg **+30 km** · Profesjonalny Serwis IT.

NIP / REGON: placeholdery w Ustawieniach (właściciel).
