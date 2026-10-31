function toRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    buildingId: row.building_id,
    createdAt: row.created_at,
    building: { id: row.building_id, name: row.building_name }
  };
}

function createRoomsRepository(db) {
  function roomsWithBuilding() {
    return db("rooms as r")
      .join("buildings as b", "b.id", "r.building_id")
      .select("r.*", "b.name as building_name");
  }

  async function findAll() {
    const rows = await roomsWithBuilding().orderBy("r.id");
    return rows.map(toRoom);
  }

  async function findById(id) {
    return toRoom(await roomsWithBuilding().where("r.id", id).first());
  }

  async function findByBuildingId(buildingId) {
    const rows = await roomsWithBuilding().where("r.building_id", buildingId).orderBy("r.id");
    return rows.map(toRoom);
  }

  async function create({ buildingId, name, capacity }) {
    const [row] = await db("rooms").insert({ building_id: buildingId, name, capacity }).returning("id");
    return findById(row.id);
  }

  async function update(id, { name, capacity }) {
    await db("rooms").where({ id }).update({ name, capacity });
    return findById(id);
  }

  async function remove(id) {
    await db("rooms").where({ id }).del();
  }

  async function lockById(id) {
    await db("rooms").where({ id }).forUpdate().first();
  }

  return { findAll, findById, findByBuildingId, create, update, remove, lockById };
}

module.exports = { createRoomsRepository };
