const request = require("supertest");
const bcrypt = require("bcryptjs");
const config = require("../../src/config");
const db = require("../../src/db/knex");
const { createApp } = require("../../src/app");
const { createKnexUnitOfWork } = require("../../src/db/unit-of-work.knex");
const { createEventBus } = require("../../src/events/eventBus");
const { registerAuditListeners } = require("../../src/events/auditListeners");

if (!config.DATABASE_URL.endsWith("_test")) {
  throw new Error("Integration tests must use a separate *_test database");
}

const { runInTransaction } = createKnexUnitOfWork(db);
const eventBus = createEventBus();
registerAuditListeners(eventBus, runInTransaction);
const app = createApp({ config, runInTransaction, eventBus });

const PASSWORD = "haslo-testowe-123";
let adminHash;

async function login(email) {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD }).expect(200);
  return res.body.accessToken;
}

async function registerAndLogin(email) {
  await request(app).post("/api/auth/register").send({ email, password: PASSWORD }).expect(201);
  return login(email);
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

function booking(day, overrides = {}) {
  return {
    roomId: 1,
    participants: 10,
    startTime: `2030-01-${day}T10:00:00Z`,
    endTime: `2030-01-${day}T12:00:00Z`,
    ...overrides
  };
}

beforeAll(async () => {
  await db.migrate.latest();
  adminHash = await bcrypt.hash(PASSWORD, 10);
});

beforeEach(async () => {
  await db.raw("TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE");
  await db("users").insert({ email: "admin@example.com", password_hash: adminHash, role: "ADMIN" });
  await db("buildings").insert({ name: "Budynek A", address: "ul. Warszawska 24, Kraków" });
  await db("rooms").insert([
    { building_id: 1, name: "101", capacity: 30 },
    { building_id: 1, name: "102", capacity: 20 }
  ]);
});

afterEach(async () => {
  await eventBus.drain();
});

afterAll(async () => {
  await db.destroy();
});

describe("Auth API", () => {
  test("rejestracja, logowanie i GET /api/auth/me", async () => {
    const token = await registerAndLogin("Jakub.Sosnowski@example.com");

    const res = await request(app).get("/api/auth/me").set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: "jakub.sosnowski@example.com", role: "USER" });
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  test("401 bez tokenu", async () => {
    const res = await request(app).get("/api/reservations");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("Reservations API", () => {
  test("POST /api/reservations zwraca 201, nagłówek Location i zapisuje rekord w bazie", async () => {
    const token = await registerAndLogin("jakub.sosnowski@example.com");

    const res = await request(app).post("/api/reservations").set(bearer(token)).send(booking("15"));

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/reservations/${res.body.id}`);

    const row = await db("reservations").where({ id: res.body.id }).first();
    expect(row).toMatchObject({ room_id: 1, user_id: 2, participants: 10, status: "CONFIRMED" });
  });

  test("400 z details dla błędnego body", async () => {
    const token = await registerAndLogin("jakub.sosnowski@example.com");

    const res = await request(app)
      .post("/api/reservations")
      .set(bearer(token))
      .send({ roomId: "abc", participants: 0, startTime: "jutro" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.map(d => d.field)).toEqual(["roomId", "participants", "startTime", "endTime"]);
    expect(res.body.error.details.every(d => d.location === "body")).toBe(true);
  });

  test("409 ROOM_ALREADY_BOOKED dla nakładającej się rezerwacji", async () => {
    const jakub = await registerAndLogin("jakub.sosnowski@example.com");
    const anna = await registerAndLogin("anna.nowak@example.com");
    await request(app).post("/api/reservations").set(bearer(jakub)).send(booking("15")).expect(201);

    const res = await request(app)
      .post("/api/reservations")
      .set(bearer(anna))
      .send(booking("15", { startTime: "2030-01-15T11:00:00Z", endTime: "2030-01-15T13:00:00Z" }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ROOM_ALREADY_BOOKED");
  });

  test("404 dla USER pobierającego cudzą rezerwację", async () => {
    const jakub = await registerAndLogin("jakub.sosnowski@example.com");
    const anna = await registerAndLogin("anna.nowak@example.com");
    const { body: created } = await request(app).post("/api/reservations").set(bearer(jakub)).send(booking("15")).expect(201);

    const res = await request(app).get(`/api/reservations/${created.id}`).set(bearer(anna));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  test("pagination: meta.total i liczba elementów w data", async () => {
    const token = await registerAndLogin("jakub.sosnowski@example.com");
    for (const day of ["15", "16", "17"]) {
      await request(app).post("/api/reservations").set(bearer(token)).send(booking(day)).expect(201);
    }

    const res = await request(app).get("/api/reservations?limit=2&page=1").set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });
});

describe("Rooms API", () => {
  test("403 dla USER próbującego utworzyć salę", async () => {
    const token = await registerAndLogin("jakub.sosnowski@example.com");

    const res = await request(app)
      .post("/api/rooms")
      .set(bearer(token))
      .send({ buildingId: 1, name: "103", capacity: 15 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

describe("Audit log API", () => {
  test("zapisuje utworzenie i anulowanie, bez nieudanej kolizji i ponownego anulowania", async () => {
    const jakub = await registerAndLogin("jakub.sosnowski@example.com");
    const admin = await login("admin@example.com");
    const { body: created } = await request(app).post("/api/reservations").set(bearer(jakub)).send(booking("15")).expect(201);
    await request(app).post("/api/reservations").set(bearer(jakub)).send(booking("15")).expect(409);
    await request(app).patch(`/api/reservations/${created.id}/cancel`).set(bearer(admin)).expect(200);
    await request(app).patch(`/api/reservations/${created.id}/cancel`).set(bearer(admin)).expect(200);
    await eventBus.drain();

    const res = await request(app).get("/api/admin/audit-log").set(bearer(admin));

    expect(res.status).toBe(200);
    expect(res.body.data.map(e => e.eventType)).toEqual(["reservation.cancelled", "reservation.created"]);
    expect(res.body.data[0].payload).toEqual({ reservationId: created.id, roomId: 1, userId: 2, cancelledBy: 1 });
    expect(res.body.meta.total).toBe(2);
  });

  test("filtr ?eventType= zwraca tylko wybrany typ, a USER dostaje 403", async () => {
    const jakub = await registerAndLogin("jakub.sosnowski@example.com");
    const admin = await login("admin@example.com");
    const { body: created } = await request(app).post("/api/reservations").set(bearer(jakub)).send(booking("15")).expect(201);
    await request(app).patch(`/api/reservations/${created.id}/cancel`).set(bearer(jakub)).expect(200);
    await eventBus.drain();

    const filtered = await request(app).get("/api/admin/audit-log?eventType=reservation.created").set(bearer(admin));
    const forbidden = await request(app).get("/api/admin/audit-log").set(bearer(jakub));

    expect(filtered.body.data.map(e => e.eventType)).toEqual(["reservation.created"]);
    expect(filtered.body.meta.total).toBe(1);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe("FORBIDDEN");
  });
});
