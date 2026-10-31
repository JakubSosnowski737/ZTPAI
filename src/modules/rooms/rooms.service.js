const { NotFoundError, ConflictError } = require("../../errors/AppError");

function createRoomsService({ runInTransaction }) {
  async function listRooms() {
    return runInTransaction(({ rooms }) => rooms.findAll());
  }

  async function getRoom(id) {
    return runInTransaction(async ({ rooms }) => {
      const room = await rooms.findById(id);
      if (!room) throw new NotFoundError("Room");
      return room;
    });
  }

  async function createRoom(input) {
    return runInTransaction(async ({ buildings, rooms }) => {
      const building = await buildings.findById(input.buildingId);
      if (!building) throw new NotFoundError("Building");
      return rooms.create(input);
    });
  }

  async function updateRoom(id, changes) {
    return runInTransaction(async ({ rooms }) => {
      const room = await rooms.findById(id);
      if (!room) throw new NotFoundError("Room");
      return rooms.update(id, changes);
    });
  }

  async function deleteRoom(id) {
    return runInTransaction(async ({ rooms, reservations }) => {
      const room = await rooms.findById(id);
      if (!room) throw new NotFoundError("Room");

      const roomReservations = await reservations.findAll({ roomId: id });
      if (roomReservations.length > 0) {
        throw new ConflictError("Room still has reservations", "ROOM_HAS_RESERVATIONS");
      }

      await rooms.remove(id);
    });
  }

  return { listRooms, getRoom, createRoom, updateRoom, deleteRoom };
}

module.exports = { createRoomsService };
