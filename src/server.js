const db = require("./db/knex");
const { createApp } = require("./app");
const { createKnexUnitOfWork } = require("./db/unit-of-work.knex");
const { createMemoryUnitOfWork } = require("./db/unit-of-work.memory");

const useMemory = process.argv.includes("--memory");
const app = createApp(useMemory ? createMemoryUnitOfWork() : createKnexUnitOfWork(db));

app.listen(3000, () => {
  console.log(`Server running on http://localhost:3000 (${useMemory ? "in-memory" : "PostgreSQL"})`);
});
