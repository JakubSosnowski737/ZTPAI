const { createUsersRepository } = require("../modules/auth/users.repository.knex");
const { createBuildingsRepository } = require("../modules/buildings/buildings.repository.knex");
const { createRoomsRepository } = require("../modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("../modules/reservations/reservations.repository.knex");
const { createAuditLogRepository } = require("../modules/audit/auditLog.repository.knex");

function createKnexRepositories(db) {
  return {
    users: createUsersRepository(db),
    buildings: createBuildingsRepository(db),
    rooms: createRoomsRepository(db),
    reservations: createReservationsRepository(db),
    auditLog: createAuditLogRepository(db)
  };
}

function createKnexUnitOfWork(db) {
  return {
    runInTransaction: fn => db.transaction(trx => fn(createKnexRepositories(trx)))
  };
}

module.exports = { createKnexUnitOfWork };
