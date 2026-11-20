const config = require("./config");
const db = require("./db/knex");
const { createApp } = require("./app");
const { createKnexUnitOfWork } = require("./db/unit-of-work.knex");
const { createMemoryUnitOfWork } = require("./db/unit-of-work.memory");

const useMemory = process.argv.includes("--memory");
const { runInTransaction } = useMemory ? createMemoryUnitOfWork() : createKnexUnitOfWork(db);
const app = createApp({ config, runInTransaction });

const server = app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT} (${useMemory ? "in-memory" : "PostgreSQL"})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await db.destroy();
    console.log("HTTP server closed, database connections closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
