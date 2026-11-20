const config = require("./config");
const db = require("./db/knex");
const { createApp } = require("./app");
const { createKnexUnitOfWork } = require("./db/unit-of-work.knex");
const { createMemoryUnitOfWork } = require("./db/unit-of-work.memory");
const { createEventBus } = require("./events/eventBus");
const { registerAuditListeners } = require("./events/auditListeners");
const { registerNotificationListeners } = require("./events/notificationListeners");

const useMemory = process.argv.includes("--memory");
const { runInTransaction } = useMemory ? createMemoryUnitOfWork() : createKnexUnitOfWork(db);
const eventBus = createEventBus();

registerAuditListeners(eventBus, runInTransaction);
registerNotificationListeners(eventBus, runInTransaction);

const app = createApp({ config, runInTransaction, eventBus });

const server = app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT} (${useMemory ? "in-memory" : "PostgreSQL"})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await eventBus.drain();
    await db.destroy();
    console.log("HTTP server closed, database connections closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
