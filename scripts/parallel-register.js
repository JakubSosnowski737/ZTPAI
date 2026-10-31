const config = require("../src/config");
const db = require("../src/db/knex");

const URL = `http://localhost:${config.PORT}/api/auth/register`;
const REQUESTS = 10;

const body = { email: "Piotr.Rownolegly@example.com", password: "rownolegla-rejestracja" };

async function send(number) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { number, status: res.status, code: data.error?.code ?? "" };
}

async function main() {
  const results = await Promise.all(Array.from({ length: REQUESTS }, (_, i) => send(i + 1)));

  for (const result of results) {
    console.log(`request ${result.number}: ${result.status} ${result.code}`.trim());
  }

  const created = results.filter(r => r.status === 201).length;
  const taken = results.filter(r => r.status === 409 && r.code === "EMAIL_TAKEN").length;
  console.log(`201: ${created}, 409 EMAIL_TAKEN: ${taken}, inne: ${REQUESTS - created - taken}`);

  const { count } = await db("users").where({ email: body.email.toLowerCase() }).count({ count: "*" }).first();
  console.log(`konta z emailem ${body.email.toLowerCase()} w bazie: ${count}`);
  await db.destroy();
}

main();
