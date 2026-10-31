const { NotFoundError, ConflictError } = require("../../errors/AppError");

function createBuildingsService({ runInTransaction }) {
  async function listBuildings() {
    return runInTransaction(({ buildings }) => buildings.findAll());
  }

  async function getBuilding(id) {
    return runInTransaction(async ({ buildings }) => {
      const building = await buildings.findById(id);
      if (!building) throw new NotFoundError("Building");
      return building;
    });
  }

  async function listBuildingRooms(id) {
    return runInTransaction(async ({ buildings, rooms }) => {
      const building = await buildings.findById(id);
      if (!building) throw new NotFoundError("Building");
      return rooms.findByBuildingId(id);
    });
  }

  async function createBuilding(input) {
    return runInTransaction(({ buildings }) => buildings.create(input));
  }

  async function updateBuilding(id, changes) {
    return runInTransaction(async ({ buildings }) => {
      const building = await buildings.findById(id);
      if (!building) throw new NotFoundError("Building");
      return buildings.update(id, changes);
    });
  }

  async function deleteBuilding(id) {
    return runInTransaction(async ({ buildings, rooms }) => {
      const building = await buildings.findById(id);
      if (!building) throw new NotFoundError("Building");

      const buildingRooms = await rooms.findByBuildingId(id);
      if (buildingRooms.length > 0) {
        throw new ConflictError("Building still has rooms", "BUILDING_HAS_ROOMS");
      }

      await buildings.remove(id);
    });
  }

  return { listBuildings, getBuilding, listBuildingRooms, createBuilding, updateBuilding, deleteBuilding };
}

module.exports = { createBuildingsService };
