function toAuditEntry(row) {
  return {
    id: Number(row.id),
    eventType: row.event_type,
    payload: row.payload,
    createdAt: row.created_at
  };
}

function createAuditLogRepository(db) {
  async function create({ eventType, payload, createdAt }) {
    const [row] = await db("audit_log")
      .insert({ event_type: eventType, payload, created_at: createdAt })
      .returning("*");
    return toAuditEntry(row);
  }

  async function list({ page, limit, eventType }) {
    const base = db("audit_log");
    if (eventType) base.where({ event_type: eventType });

    const [rows, { count }] = await Promise.all([
      base.clone()
        .select("*")
        .orderBy("created_at", "desc")
        .orderBy("id", "desc")
        .limit(limit)
        .offset((page - 1) * limit),
      base.clone().count({ count: "*" }).first()
    ]);

    return { items: rows.map(toAuditEntry), total: Number(count) };
  }

  return { create, list };
}

module.exports = { createAuditLogRepository };
