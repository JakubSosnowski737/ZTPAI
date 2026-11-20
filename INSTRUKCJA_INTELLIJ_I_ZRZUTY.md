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

---

## 3. Checklist zrzutów (plik i dokładne linie)

Każdy zakres mieści się na jednym ekranie IntelliJ. Do konkretnej linii skacze **Ctrl+G**.

### Zadanie 1 — unit testy

| Zrzut | Plik | Linie |
|-------|------|-------|
| `zad1-setup.png` | `tests/unit/reservations.service.test.js` | 1–34 |
| `zad1-test-each.png` | `tests/unit/reservations.service.test.js` | 36–57 |
| `zad1-uow-memory.png` | `src/db/unit-of-work.memory.js` | 1–29 (cały plik) |

### Zadanie 2 — testy integracyjne

| Zrzut | Plik | Linie |
|-------|------|-------|
| `zad2-app.png` | `tests/integration/api.test.js` | 1–30 |
| `zad2-hooks.png` | `tests/integration/api.test.js` | 46–67 |
| `zad2-test-post.png` | `tests/integration/api.test.js` | 88–113 |
| `zad2-testy.png` | `tests/integration/api.test.js` | 115–151 |

### Zadanie 3 — Docker

| Zrzut | Gdzie | Co |
|-------|-------|----|
| `zad3-shutdown.png` | `src/server.js` | linie 1–34 (cały plik) |
| `zad3-swagger.png` | przeglądarka, http://localhost:3000/api/docs (API z kontenera) | góra strony: pasek adresu i tytuł z wersją 5.0.0 |

### Zadanie 4 — eventy i audit log

| Zrzut | Plik | Linie |
|-------|------|-------|
| `zad4-eventbus.png` | `src/events/eventBus.js` | 1–34 (cały plik) |
| `zad4-service-create.png` | `src/modules/reservations/reservations.service.js` | 71–111 |
| `zad4-service-cancel.png` | `src/modules/reservations/reservations.service.js` | 114–149 |
| `zad4-audit-listener.png` | `src/events/auditListeners.js` | 1–17 (cały plik) |
| `zad4-notification-listener.png` | `src/events/notificationListeners.js` | 1–19 (cały plik) |
| `zad4-migracja.png` | `src/db/migrations/20261115100000_create_audit_log.js` | 1–13 (cały plik) |
| `zad4-unit-test.png` | `tests/unit/reservations.service.test.js` | 170–209 |

Zrzuty z `audit-log.http` (panel odpowiedzi po prawej):

1. Czysty stan: `docker compose exec api npx knex seed:run`.
2. Uruchom po kolei zielonym ▶ requesty z linii **2, 15, 28, 44, 56, 60, 64**.
3. `zad4-audit-log.png` — odpowiedź na request z linii **64** (200, dwa wpisy: najpierw `reservation.cancelled`, potem `reservation.created`).
4. `zad4-audit-403.png` — uruchom request z linii **72** i zrób zrzut odpowiedzi (403 `FORBIDDEN`).

### Zadanie 5 — GitHub Actions (przeglądarka)

| Zrzut | Strona |
|-------|--------|
| `zad5-readme-badge.png` | https://github.com/JakubSosnowski737/ZTPAI — README z badge „CI passing” |
| `zad5-ci-czerwony.png` | pull request z brancha `ci-demo`, zakładka **Conversation** — czerwony check na dole |
| `zad5-ci-zielony.png` | ten sam pull request po poprawce — zielony check |
| `zad5-pr-merged.png` | ten sam pull request po **Merge pull request** — fioletowe „Merged” |
| `zad5-actions.png` | https://github.com/JakubSosnowski737/ZTPAI/actions — lista uruchomień |

Wyniki testów, logi Dockera, tabela `audit_log` i izolacja błędów są już w sprawozdaniu jako tekst z prawdziwych uruchomień.

---

## 4. GitHub (zadanie 5)

Repozytorium: https://github.com/JakubSosnowski737/ZTPAI

1. `main` jest wypchnięty, workflow `CI` w zakładce **Actions** kończy się na zielono.
2. Ochrona przez CI:
   - branch `ci-demo`: w `overlaps` (linia 14 `src/modules/reservations/reservations.service.js`) `<` zamienione na `<=`, `git push -u origin ci-demo`,
   - pull request: https://github.com/JakubSosnowski737/ZTPAI/compare/main...ci-demo?expand=1 → **Create pull request** → po 1–2 minutach czerwony check (zrzut),
   - przywrócenie `<`, commit i push do `ci-demo` → zielony check (zrzut),
   - **Merge pull request** → **Confirm merge** (zrzut).
3. Po merge: `git pull`, potem `git rev-parse --short HEAD` i ten hash w sprawozdaniu w miejscu `UZUPELNIJ` (linia 43).

## 5. Kompilacja sprawozdania

Overleaf, kompilator **pdfLaTeX** (jak w poprzednich labach), obrazy w folderze `img/`.
