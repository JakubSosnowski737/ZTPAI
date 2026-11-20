# LAB05 — IntelliJ, testy, Docker i zrzuty do sprawozdania

Sprawozdanie: `sprawozdanie/sprawozdanie.tex`
Obrazy: `sprawozdanie/img/<nazwa>.png` (dokładne nazwy z tabel niżej).

Porty: baza LAB05 na **5434** (LAB03 = 5432, LAB04 = 5433), API na **3000**. Na porcie 3000 może działać tylko jedno API naraz — albo kontener `api`, albo `npm start` / Run w IntelliJ.

---

## 1. Otwarcie projektu

1. **File → Open** → `C:\Studia\Semestr7\ZPAI\LAB05`.
2. Konfiguracje Run (folder `.run/`): `Start API`, `Start API JWT 10s`, `Testy - npm test`, `Testy - unit`, `Testy - integracyjne`.
3. Testy (potrzebna baza z bazą testową `roombooking_test`):

```bash
docker compose up -d db
npm install
npm test
```

## 2. Docker Compose (cały stack)

```bash
docker compose up --build -d
docker compose exec api npx knex seed:run
```

- API: http://localhost:3000, Swagger UI: http://localhost:3000/api/docs
- logi: `docker compose logs api`, zatrzymanie: `docker compose down`
- konta z seeda — hasła w `src/db/seeds/01_users.js`

Przed scenariuszem z audit logiem zrób seed (czysty stan), a potem uruchom `audit-log.http` od góry (dwa logowania zapisują tokeny).

---

## 3. Checklist zrzutów

### Zadanie 1 — unit testy

| Plik | Co sfotografować |
|------|------------------|
| `zad1-setup.png` | początek `tests/unit/reservations.service.test.js`: `NOW`, `reservation()`, `booking()`, `setup()` |
| `zad1-test-each.png` | `test.each` z nakładaniem się i przedziałami stykającymi się |
| `zad1-uow-memory.png` | `src/db/unit-of-work.memory.js` (`createMemoryUnitOfWork(initial)`) |

### Zadanie 2 — testy integracyjne

| Plik | Co sfotografować |
|------|------------------|
| `zad2-hooks.png` | początek `tests/integration/api.test.js`: `createApp`, warunek `_test`, `beforeAll` / `beforeEach` / `afterEach` / `afterAll` |
| `zad2-test-post.png` | test `POST /api/reservations` (201, `Location`, rekord w bazie) |
| `zad2-testy.png` | testy 400 z `details`, 409, 404 i pagination |

### Zadanie 3 — Docker

| Plik | Co sfotografować |
|------|------------------|
| `zad3-shutdown.png` | `src/server.js` — funkcja `shutdown` i `process.on("SIGTERM")` |
| `zad3-swagger.png` | przeglądarka: Swagger UI z kontenera (`docker compose up`) |

### Zadanie 4 — eventy i audit log

| Plik | Co sfotografować |
|------|------------------|
| `zad4-eventbus.png` | `src/events/eventBus.js` |
| `zad4-service.png` | `reservations.service.js` — `eventBus.publish` po `runInTransaction` (tworzenie i anulowanie) |
| `zad4-listeners.png` | `src/events/auditListeners.js` i `notificationListeners.js` |
| `zad4-migracja.png` | `src/db/migrations/20261115100000_create_audit_log.js` |
| `zad4-unit-test.png` | `describe("eventy")` w `tests/unit/reservations.service.test.js` |
| `zad4-audit-log.png` | HTTP: `GET /api/admin/audit-log` jako ADMIN (`audit-log.http`) |
| `zad4-audit-403.png` | HTTP: `GET /api/admin/audit-log` jako USER (403) |

### Zadanie 5 — GitHub Actions

| Plik | Co sfotografować |
|------|------------------|
| `zad5-readme-badge.png` | strona repozytorium na GitHubie: README z badge CI |
| `zad5-ci-czerwony.png` | pull request z błędem — czerwony check |
| `zad5-ci-zielony.png` | ten sam pull request po poprawce — zielony check |
| `zad5-pr-merged.png` | zmergowany pull request |
| `zad5-actions.png` | zakładka **Actions** z listą uruchomień workflow |

Wyniki testów, logi Dockera, tabela `audit_log` i izolacja błędów są już w sprawozdaniu jako tekst z prawdziwych uruchomień.

---

## 4. GitHub (zadanie 5)

1. Na GitHubie: **New repository**, np. `room-booking-api`, puste (bez README i .gitignore). Repozytorium prywatne → **Settings → Collaborators** → dodaj prowadzącego.
2. W LAB05:

```bash
git remote add origin https://github.com/<login>/room-booking-api.git
git push -u origin main
```

3. W zakładce **Actions** workflow `CI` na `main` powinien skończyć się na zielono.
4. Badge w README: `![CI](https://github.com/<login>/room-booking-api/actions/workflows/ci.yml/badge.svg)`.
5. Ochrona przez CI:
   - `git switch -c ci-demo`, w `overlaps` (`src/modules/reservations/reservations.service.js`) zamień `<` na `<=`, commit, `git push -u origin ci-demo`,
   - na GitHubie **Compare & pull request** → workflow na czerwono (zrzut),
   - przywróć `<`, commit, push do tego samego brancha → zielono (zrzut),
   - **Merge pull request** (zrzut).
6. W sprawozdaniu wpisz link do repozytorium i hash commita (`git rev-parse --short HEAD` po merge) w miejscach `UZUPELNIJ`.

## 5. Kompilacja sprawozdania

Overleaf, kompilator **pdfLaTeX** (jak w poprzednich labach), obrazy w folderze `img/`.
