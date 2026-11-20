const { EVENT_TYPES } = require("./eventTypes");

function registerAuditListeners(eventBus, runInTransaction) {
  async function save(event) {
    await runInTransaction(({ auditLog }) => auditLog.create({
      eventType: event.name,
      payload: event.payload,
      createdAt: event.occurredAt
    }));
  }

  for (const eventType of EVENT_TYPES) {
    eventBus.subscribe(eventType, save);
  }
}

module.exports = { registerAuditListeners };
