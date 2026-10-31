const db = require("../src/db/knex");

const URL = "http://localhost:3000/api/reservations";
const REQUESTS = 10;

const body = {
  roomId: 3,
  reservedBy: "Jakub Sosnowski",
  participants: 10,
  startTime: "2026-11-20T10:00:00Z",
  endTime: "2026-11-20T12:00:00Z"
};

async function send(number) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return { number, status: res.status };
}

async function main() {
  const results = await Promise.all(Array.from({ length: REQUESTS }, (_, i) => send(i + 1)));

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
