const SORT_COLUMNS = {
  startTime: "r.start_time",
  createdAt: "r.created_at",
  participants: "r.participants"
};

const COLUMNS = ["r.*", "rm.name as room_name", "rm.building_id", "b.name as building_name"];

function toReservation(row) {
  if (!row) return null;
  return {
    id: row.id,
    roomId: row.room_id,
    reservedBy: row.reserved_by,
    participants: row.participants,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    room: {
      id: row.room_id,
      name: row.room_name,
      building: { id: row.building_id, name: row.building_name }
    }
  };
}

function applyFilters(query, { roomId, buildingId, status, from, to }) {
  if (roomId) query.where("r.room_id", roomId);
  if (buildingId) query.where("rm.building_id", buildingId);
  if (status) query.where("r.status", status);
  if (from) query.where("r.end_time", ">", from);
  if (to) query.where("r.start_time", "<", to);
  return query;
}

function createReservationsRepository(db) {
  function withRoomAndBuilding() {
    return db("reservations as r")
      .join("rooms as rm", "rm.id", "r.room_id")
      .join("buildings as b", "b.id", "rm.building_id");
  }

  async function findById(id) {
    return toReservation(await withRoomAndBuilding().select(COLUMNS).where("r.id", id).first());
  }

  async function findAll(filters = {}) {
    const rows = await applyFilters(withRoomAndBuilding().select(COLUMNS), filters).orderBy("r.id");
    return rows.map(toReservation);
  }

  async function list({ page, limit, sort, ...filters }) {
    const desc = sort.startsWith("-");
    const column = SORT_COLUMNS[desc ? sort.slice(1) : sort];
    const base = applyFilters(withRoomAndBuilding(), filters);

    const [rows, { count }] = await Promise.all([
      base.clone()
        .select(COLUMNS)
        .orderBy(column, desc ? "desc" : "asc")
        .orderBy("r.id", "asc")
        .limit(limit)
        .offset((page - 1) * limit),
      base.clone().count({ count: "*" }).first()
    ]);

    return { items: rows.map(toReservation), total: Number(count) };
  }

  async function create(data) {
    const [row] = await db("reservations")
      .insert({
        room_id: data.roomId,
        reserved_by: data.reservedBy,
        participants: data.participants,
        start_time: data.startTime,
        end_time: data.endTime,
        status: data.status,
        created_at: data.createdAt,
        cancelled_at: data.cancelledAt
      })
      .returning("id");
    return findById(row.id);
  }

  async function update(id, changes) {
    await db("reservations").where({ id }).update({
      status: changes.status,
      cancelled_at: changes.cancelledAt
    });
    return findById(id);
  }

  return { findById, findAll, list, create, update };
}

module.exports = { createReservationsRepository };
