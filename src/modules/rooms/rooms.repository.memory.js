const createdAt = new Date("2026-10-25T10:00:00.000Z");

const roomsSeed = [
  { id: 1, buildingId: 1, name: "101", capacity: 30, createdAt },
  { id: 2, buildingId: 1, name: "102", capacity: 20, createdAt },
  { id: 3, buildingId: 1, name: "201", capacity: 50, createdAt },
  { id: 4, buildingId: 2, name: "101", capacity: 100, createdAt },
  { id: 5, buildingId: 2, name: "Aula", capacity: 200, createdAt }
];

function createRoomsRepository(store) {
  let nextId = Math.max(0, ...store.rooms.map(r => r.id)) + 1;

  function withBuilding(room) {
    const building = store.buildings.find(b => b.id === room.buildingId);
    return { ...room, building: { id: building.id, name: building.name } };
  }

  async function findAll() {
    return store.rooms.map(withBuilding);
  }

  async function findById(id) {
    const room = store.rooms.find(r => r.id === id);
    return room ? withBuilding(room) : null;
  }

  async function findByBuildingId(buildingId) {
    return store.rooms.filter(r => r.buildingId === buildingId).map(withBuilding);
  }

  async function create({ buildingId, name, capacity }) {
    const room = { id: nextId++, buildingId, name, capacity, createdAt: new Date() };
    store.rooms.push(room);
    return withBuilding(room);
  }

  async function update(id, { name, capacity }) {
    const room = store.rooms.find(r => r.id === id);
    if (name !== undefined) room.name = name;
    if (capacity !== undefined) room.capacity = capacity;
    return withBuilding(room);
  }

  async function remove(id) {
    store.rooms = store.rooms.filter(r => r.id !== id);
  }

  async function lockById() {
  }

  return { findAll, findById, findByBuildingId, create, update, remove, lockById };
}

module.exports = { roomsSeed, createRoomsRepository };
