const config = require("../src/config");
const db = require("../src/db/knex");

const BASE_URL = `http://localhost:${config.PORT}`;
const REQUESTS = 10;

const credentials = { email: "jakub.sosnowski@example.com", password: "jakub-password-123" };

const body = {
  roomId: 3,
  participants: 10,
  startTime: "2026-11-20T10:00:00Z",
  endTime: "2026-11-20T12:00:00Z"
};

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  const { accessToken } = await res.json();
  return accessToken;
}

async function send(number, token) {
  const res = await fetch(`${BASE_URL}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  return { number, status: res.status };
}

async function main() {
  const token = await login();
  const results = await Promise.all(Array.from({ length: REQUESTS }, (_, i) => send(i + 1, token)));

  for (const result of results) {
    console.log(`request ${result.number}: ${result.status}`);
  }

  const created = results.filter(r => r.status === 201).length;
  const conflicts = results.filter(r => r.status === 409).length;
  console.log(`201: ${created}, 409: ${conflicts}, inne: ${REQUESTS - created - conflicts}`);

  const { count } = await db("reservations")
    .where({ room_id: body.roomId, status: "CONFIRMED" })
    .where("start_time", "<", body.endTime)
    .where("end_time", ">", body.startTime)
    .count({ count: "*" })
    .first();

  console.log(`CONFIRMED w bazie dla sali ${body.roomId} (${body.startTime} - ${body.endTime}): ${count}`);
  await db.destroy();
}

main();
