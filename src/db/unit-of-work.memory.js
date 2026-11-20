const { usersSeed, createUsersRepository } = require("../modules/auth/users.repository.memory");
const { buildingsSeed, createBuildingsRepository } = require("../modules/buildings/buildings.repository.memory");
const { roomsSeed, createRoomsRepository } = require("../modules/rooms/rooms.repository.memory");
const { reservationsSeed, createReservationsRepository } = require("../modules/reservations/reservations.repository.memory");

function createMemoryUnitOfWork(initial = {}) {
  const store = {
    users: structuredClone(initial.users ?? usersSeed),
    buildings: structuredClone(initial.buildings ?? buildingsSeed),
    rooms: structuredClone(initial.rooms ?? roomsSeed),
    reservations: structuredClone(initial.reservations ?? reservationsSeed)
  };

  const repositories = {
    users: createUsersRepository(store),
    buildings: createBuildingsRepository(store),
    rooms: createRoomsRepository(store),
    reservations: createReservationsRepository(store)
  };

  return {
    runInTransaction: fn => fn(repositories)
  };
}

module.exports = { createMemoryUnitOfWork };
