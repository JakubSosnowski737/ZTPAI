const { createBuildingsRepository } = require("../modules/buildings/buildings.repository.knex");
const { createRoomsRepository } = require("../modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("../modules/reservations/reservations.repository.knex");

function createKnexRepositories(db) {
  return {
    buildings: createBuildingsRepository(db),
    rooms: createRoomsRepository(db),
    reservations: createReservationsRepository(db)
  };
}

function createKnexUnitOfWork(db) {
  return {
    runInTransaction: fn => db.transaction(trx => fn(createKnexRepositories(trx)))
  };
}

module.exports = { createKnexUnitOfWork };
