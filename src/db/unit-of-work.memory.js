const { usersSeed, createUsersRepository } = require("../modules/auth/users.repository.memory");
const { buildingsSeed, createBuildingsRepository } = require("../modules/buildings/buildings.repository.memory");
const { roomsSeed, createRoomsRepository } = require("../modules/rooms/rooms.repository.memory");
const { reservationsSeed, createReservationsRepository } = require("../modules/reservations/reservations.repository.memory");

function createMemoryUnitOfWork() {
  const store = {
    users: structuredClone(usersSeed),
    buildings: structuredClone(buildingsSeed),
    rooms: structuredClone(roomsSeed),
    reservations: structuredClone(reservationsSeed)
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
