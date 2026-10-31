const { NotFoundError, ConflictError, ValidationError } = require("../../errors/AppError");

const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

const ALLOWED_TRANSITIONS = {
  CONFIRMED: ["CANCELLED"],
  CANCELLED: []
};

function overlaps(a, b) {
  return a.startTime.getTime() < b.endTime.getTime() && b.startTime.getTime() < a.endTime.getTime();
}

function createReservationsService({ reservationsRepository, roomsRepository, now = () => new Date() }) {
  async function listReservations(filters) {
    return reservationsRepository.findAll(filters);
  }

  async function getReservation(id) {
    const reservation = await reservationsRepository.findById(id);
    if (!reservation) throw new NotFoundError("Reservation");
    return reservation;
  }

  async function createReservation(input) {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    const duration = endTime.getTime() - startTime.getTime();

    if (duration <= 0) {
      throw new ValidationError([
        { location: "body", field: "endTime", message: "endTime must be later than startTime" }
      ]);
    }

    if (duration < MIN_DURATION_MS || duration > MAX_DURATION_MS) {
      throw new ValidationError([
        { location: "body", field: "endTime", message: "Reservation must last from 15 minutes to 8 hours" }
      ]);
    }

    if (startTime.getTime() < now().getTime()) {
      throw new ValidationError([
        { location: "body", field: "startTime", message: "startTime cannot be in the past" }
      ]);
    }

    const room = await roomsRepository.findById(input.roomId);
    if (!room) throw new NotFoundError("Room");

    if (input.participants > room.capacity) {
      throw new ConflictError("Room capacity exceeded", "ROOM_CAPACITY_EXCEEDED");
    }

    const roomReservations = await reservationsRepository.findAll({ roomId: room.id });
    const isBooked = roomReservations.some(
      r => r.status === "CONFIRMED" && overlaps(r, { startTime, endTime })
    );

    if (isBooked) {
      throw new ConflictError("Room is already booked for this time", "ROOM_ALREADY_BOOKED");
    }

    return reservationsRepository.create({
      roomId: room.id,
      reservedBy: input.reservedBy,
      participants: input.participants,
      startTime,
      endTime,
      status: "CONFIRMED",
      createdAt: now(),
      cancelledAt: null,
      internalNote: "created via API v2"
    });
  }

  async function cancelReservation(id) {
    const reservation = await getReservation(id);
    const newStatus = "CANCELLED";

    if (reservation.status === newStatus) return reservation;

    if (!ALLOWED_TRANSITIONS[reservation.status].includes(newStatus)) {
      throw new ConflictError(
        `Cannot change status from ${reservation.status} to ${newStatus}`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    if (reservation.startTime.getTime() <= now().getTime()) {
      throw new ConflictError("Reservation has already started", "RESERVATION_ALREADY_STARTED");
    }

    return reservationsRepository.update(id, { status: newStatus, cancelledAt: now() });
  }

  return { listReservations, getReservation, createReservation, cancelReservation };
}

module.exports = { createReservationsService };
