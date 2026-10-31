function toBuilding(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    createdAt: row.created_at
  };
}

function createBuildingsRepository(db) {
  async function findAll() {
    const rows = await db("buildings as b")
      .leftJoin("rooms as r", "r.building_id", "b.id")
      .select("b.*")
      .count({ rooms_count: "r.id" })
      .groupBy("b.id")
      .orderBy("b.id");
    return rows.map(row => ({ ...toBuilding(row), roomsCount: Number(row.rooms_count) }));
  }

  async function findById(id) {
    return toBuilding(await db("buildings").where({ id }).first());
  }

  async function create({ name, address }) {
    const [row] = await db("buildings").insert({ name, address }).returning("*");
    return toBuilding(row);
  }

  return { findAll, findById, create };
}

module.exports = { createBuildingsRepository };
