function createReservationsRepository() {
  const reservations = [
    {
      id: 1,
      roomId: 4,
      reservedBy: "Jakub Sosnowski",
      participants: 10,
      startTime: new Date("2026-10-01T08:00:00.000Z"),
      endTime: new Date("2026-10-01T10:00:00.000Z"),
      status: "CONFIRMED",
      createdAt: new Date("2026-09-20T12:00:00.000Z"),
      cancelledAt: null,
      internalNote: "seed data"
    }
  ];

  let nextId = Math.max(0, ...reservations.map(r => r.id)) + 1;

  return {
    async findAll({ roomId } = {}) {
      return reservations.filter(r => roomId === undefined || r.roomId === roomId);
    },

    async findById(id) {
      return reservations.find(r => r.id === id) ?? null;
    },

    async create(data) {
      const reservation = { id: nextId++, ...data };
      reservations.push(reservation);
      return reservation;
    },

    async update(id, changes) {
      const reservation = reservations.find(r => r.id === id);
      Object.assign(reservation, changes);
      return reservation;
    }
  };
}

module.exports = { createReservationsRepository };
