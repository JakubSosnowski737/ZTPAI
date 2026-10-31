const createdAt = new Date("2026-10-25T10:00:00.000Z");

const reservationsSeed = [
  {
    id: 1,
    roomId: 1,
    reservedBy: "Jakub Sosnowski",
    participants: 20,
    startTime: new Date("2026-11-10T10:00:00.000Z"),
    endTime: new Date("2026-11-10T12:00:00.000Z"),
    status: "CONFIRMED",
    createdAt,
    cancelledAt: null
  },
  {
    id: 2,
    roomId: 1,
    reservedBy: "Anna Nowak",
    participants: 25,
    startTime: new Date("2026-11-10T12:00:00.000Z"),
    endTime: new Date("2026-11-10T13:00:00.000Z"),
    status: "CONFIRMED",
    createdAt,
    cancelledAt: null
  },
  {
    id: 3,
    roomId: 2,
    reservedBy: "Jakub Sosnowski",
    participants: 15,
    startTime: new Date("2026-11-12T09:00:00.000Z"),
    endTime: new Date("2026-11-12T10:30:00.000Z"),
    status: "CANCELLED",
    createdAt,
    cancelledAt: new Date("2026-10-28T09:00:00.000Z")
  },
  {
    id: 4,
    roomId: 4,
    reservedBy: "Anna Nowak",
    participants: 80,
    startTime: new Date("2026-10-20T08:00:00.000Z"),
    endTime: new Date("2026-10-20T10:00:00.000Z"),
    status: "CONFIRMED",
    createdAt: new Date("2026-10-10T10:00:00.000Z"),
    cancelledAt: null
  },
  {
    id: 5,
    roomId: 5,
    reservedBy: "Jakub Sosnowski",
    participants: 150,
    startTime: new Date("2026-11-15T14:00:00.000Z"),
    endTime: new Date("2026-11-15T16:00:00.000Z"),
    status: "CONFIRMED",
    createdAt,
    cancelledAt: null
  }
];

function createReservationsRepository(store) {
  let nextId = Math.max(0, ...store.reservations.map(r => r.id)) + 1;

  function withRoom(reservation) {
    const room = store.rooms.find(r => r.id === reservation.roomId);
    const building = store.buildings.find(b => b.id === room.buildingId);
    return {
      ...reservation,
      room: { id: room.id, name: room.name, building: { id: building.id, name: building.name } }
    };
  }

  function matches(reservation, { roomId, buildingId, status, from, to }) {
    const room = store.rooms.find(r => r.id === reservation.roomId);
    return (roomId === undefined || reservation.roomId === roomId)
      && (buildingId === undefined || room.buildingId === buildingId)
      && (status === undefined || reservation.status === status)
      && (from === undefined || reservation.endTime.getTime() > new Date(from).getTime())
      && (to === undefined || reservation.startTime.getTime() < new Date(to).getTime());
  }

  async function findById(id) {
    const reservation = store.reservations.find(r => r.id === id);
    return reservation ? withRoom(reservation) : null;
  }

  async function findAll(filters = {}) {
    return store.reservations.filter(r => matches(r, filters)).map(withRoom);
  }

  async function list({ page, limit, sort, ...filters }) {
    const desc = sort.startsWith("-");
    const field = desc ? sort.slice(1) : sort;
    const sorted = store.reservations
      .filter(r => matches(r, filters))
      .sort((a, b) => (a[field] - b[field]) * (desc ? -1 : 1) || a.id - b.id);
    return { items: sorted.slice((page - 1) * limit, page * limit).map(withRoom), total: sorted.length };
  }

  async function create(data) {
    const reservation = { id: nextId++, ...data };
    store.reservations.push(reservation);
    return withRoom(reservation);
  }

  async function update(id, changes) {
    const reservation = store.reservations.find(r => r.id === id);
    Object.assign(reservation, changes);
    return withRoom(reservation);
  }

  return { findById, findAll, list, create, update };
}

module.exports = { reservationsSeed, createReservationsRepository };
