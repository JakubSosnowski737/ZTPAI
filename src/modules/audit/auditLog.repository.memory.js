function createAuditLogRepository(store) {
  let nextId = Math.max(0, ...store.auditLog.map(e => e.id)) + 1;

  async function create({ eventType, payload, createdAt }) {
    const entry = { id: nextId++, eventType, payload, createdAt: new Date(createdAt) };
    store.auditLog.push(entry);
    return entry;
  }

  async function list({ page, limit, eventType }) {
    const sorted = store.auditLog
      .filter(e => eventType === undefined || e.eventType === eventType)
      .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
    return { items: sorted.slice((page - 1) * limit, page * limit), total: sorted.length };
  }

  return { create, list };
}

module.exports = { createAuditLogRepository };
