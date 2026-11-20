const { RESERVATION_CANCELLED } = require("./eventTypes");

function registerNotificationListeners(eventBus, runInTransaction, log = console.log) {
  eventBus.subscribe(RESERVATION_CANCELLED, async event => {
    const { reservationId, userId, cancelledBy } = event.payload;
    if (cancelledBy === userId) return;

    const { owner, canceller } = await runInTransaction(async ({ users }) => ({
      owner: await users.findById(userId),
      canceller: await users.findById(cancelledBy)
    }));

    if (canceller?.role !== "ADMIN") return;

    log(`[notification] to: ${owner.email} | your reservation #${reservationId} was cancelled by ADMIN ${canceller.email}`);
  });
}

module.exports = { registerNotificationListeners };
