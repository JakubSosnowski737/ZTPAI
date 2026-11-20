# Room Booking API

API do rezerwacji sal w budynkach: Express 5, Zod, PostgreSQL 16, Knex, JWT, Swagger UI.
Projekt z laboratoriów ZPAI (Jakub Sosnowski 151935).

## Uruchomienie od zera (Docker)

Wymagany jest tylko Docker z Docker Compose.

```bash
git clone <adres-repozytorium> room-booking-api
cd room-booking-api
cp .env.example .env
docker compose up --build
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api/docs

Migracje wykonują się same przy starcie kontenera `api`. Przykładowe dane (konto ADMIN, użytkownicy, budynki, sale, rezerwacje) wgrywa seed w działającym kontenerze:

```bash
docker compose exec api npx knex seed:run
```

Konta z seeda: `admin@example.com` (ADMIN), `jakub.sosnowski@example.com` i `anna.nowak@example.com` (USER). Hasła są w pliku `src/db/seeds/01_users.js`.

Zatrzymanie: `docker compose down` (dane zostają w wolumenie `pgdata`) albo `docker compose down -v` (razem z danymi).

## Testy

Testy integracyjne używają osobnej bazy `roombooking_test` (zmienna `TEST_DATABASE_URL` w `.env`), którą tworzy skrypt `docker/initdb` przy pierwszym starcie kontenera `db`.

```bash
docker compose up -d db
npm ci
npm test
```

- `npm run test:unit` - unit testy service'ów (repositories in-memory, bez bazy),
- `npm run test:integration` - testy API przez Supertest na bazie testowej.

## Uruchomienie API bez Dockera

```bash
docker compose up -d db
npm ci
npm run migrate
npm run seed
npm start
```
