const buildingsSeed = [
  { id: 1, name: "Budynek A", address: "ul. Warszawska 24, Kraków", createdAt: new Date("2026-10-25T10:00:00.000Z") },
  { id: 2, name: "Budynek B", address: "al. Mickiewicza 30, Kraków", createdAt: new Date("2026-10-25T10:00:00.000Z") },
  { id: 3, name: "Budynek C", address: "ul. Podchorążych 2, Kraków", createdAt: new Date("2026-10-25T10:00:00.000Z") }
];

function createBuildingsRepository(store) {
  let nextId = Math.max(0, ...store.buildings.map(b => b.id)) + 1;

  async function findAll() {
    return store.buildings.map(building => ({
      ...building,
      roomsCount: store.rooms.filter(room => room.buildingId === building.id).length
    }));
  }

  async function findById(id) {
    return store.buildings.find(building => building.id === id) ?? null;
  }

  async function create({ name, address }) {
    const building = { id: nextId++, name, address, createdAt: new Date() };
    store.buildings.push(building);
    return building;
  }

  async function update(id, { name, address }) {
    const building = store.buildings.find(b => b.id === id);
    if (name !== undefined) building.name = name;
    if (address !== undefined) building.address = address;
    return building;
  }

  async function remove(id) {
    store.buildings = store.buildings.filter(b => b.id !== id);
  }

  return { findAll, findById, create, update, remove };
}

module.exports = { buildingsSeed, createBuildingsRepository };
