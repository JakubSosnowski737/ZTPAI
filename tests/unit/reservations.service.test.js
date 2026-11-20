const { createReservationsService } = require("../../src/modules/reservations/reservations.service");
const { createMemoryUnitOfWork } = require("../../src/db/unit-of-work.memory");

const NOW = new Date("2026-11-01T12:00:00Z");

const admin = { id: 1, role: "ADMIN" };
const jakub = { id: 2, role: "USER" };
const anna = { id: 3, role: "USER" };

function reservation(id, overrides = {}) {
  return {
    id,
    roomId: 1,
    userId: jakub.id,
    participants: 10,
    startTime: new Date("2026-11-10T10:00:00Z"),
    endTime: new Date("2026-11-10T12:00:00Z"),
    status: "CONFIRMED",
    createdAt: NOW,
    cancelledAt: null,
    ...overrides
  };
}

function booking(startTime, endTime, overrides = {}) {
  return { roomId: 1, participants: 10, startTime, endTime, ...overrides };
}

function setup(reservations = [], now = () => NOW) {
  const { runInTransaction } = createMemoryUnitOfWork({ reservations });
  const eventBus = { publish: jest.fn(), subscribe: jest.fn() };
  const service = createReservationsService({ runInTransaction, eventBus, now });
  return { service, eventBus };
}

describe("createReservation - nakładanie się rezerwacji", () => {
  test.each([
    ["częściowo na początku", "2026-11-10T09:00:00Z", "2026-11-10T11:00:00Z"],
    ["częściowo na końcu", "2026-11-10T11:00:00Z", "2026-11-10T13:00:00Z"],
    ["i zawiera całą istniejącą", "2026-11-10T09:00:00Z", "2026-11-10T13:00:00Z"],
    ["i zawiera się w istniejącej", "2026-11-10T10:30:00Z", "2026-11-10T11:00:00Z"]
  ])("odrzuca rezerwację, która nakłada się %s", async (_, startTime, endTime) => {
    const { service } = setup([reservation(1)]);

    await expect(service.createReservation(booking(startTime, endTime), anna))
      .rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });
  });

  test.each([
    ["kończy się, gdy istniejąca się zaczyna", "2026-11-10T08:00:00Z", "2026-11-10T10:00:00Z"],
    ["zaczyna się, gdy istniejąca się kończy", "2026-11-10T12:00:00Z", "2026-11-10T13:00:00Z"]
  ])("pozwala na rezerwację, która %s", async (_, startTime, endTime) => {
    const { service } = setup([reservation(1)]);

    await expect(service.createReservation(booking(startTime, endTime), anna))
      .resolves.toMatchObject({ status: "CONFIRMED", userId: anna.id });
  });

  test("pozwala na ten sam przedział w innej sali", async () => {
    const { service } = setup([reservation(1)]);

    await expect(service.createReservation(booking("2026-11-10T10:00:00Z", "2026-11-10T12:00:00Z", { roomId: 2 }), anna))
      .resolves.toMatchObject({ roomId: 2, status: "CONFIRMED" });
  });

  test("anulowana rezerwacja nie blokuje przedziału", async () => {
    const { service } = setup([reservation(1, { status: "CANCELLED", cancelledAt: NOW })]);

    await expect(service.createReservation(booking("2026-11-10T10:00:00Z", "2026-11-10T12:00:00Z"), anna))
      .resolves.toMatchObject({ status: "CONFIRMED" });
  });
});

describe("createReservation - pojemność sali", () => {
  test("pozwala, gdy liczba uczestników jest równa pojemności sali", async () => {
    const { service } = setup();

    await expect(service.createReservation(booking("2026-11-20T10:00:00Z", "2026-11-20T11:00:00Z", { participants: 30 }), jakub))
      .resolves.toMatchObject({ participants: 30 });
  });

  test("odrzuca, gdy uczestników jest o jednego więcej niż miejsc", async () => {
    const { service } = setup();

    await expect(service.createReservation(booking("2026-11-20T10:00:00Z", "2026-11-20T11:00:00Z", { participants: 31 }), jakub))
      .rejects.toMatchObject({ code: "ROOM_CAPACITY_EXCEEDED" });
  });
});

describe("createReservation - czas trwania", () => {
  test.each([
    ["dokładnie 15 minut", "2026-11-20T10:00:00Z", "2026-11-20T10:15:00Z"],
    ["dokładnie 8 godzin", "2026-11-20T08:00:00Z", "2026-11-20T16:00:00Z"]
  ])("pozwala na rezerwację trwającą %s", async (_, startTime, endTime) => {
    const { service } = setup();

    await expect(service.createReservation(booking(startTime, endTime), jakub))
      .resolves.toMatchObject({ status: "CONFIRMED" });
  });

  test.each([
    ["14 minut", "2026-11-20T10:00:00Z", "2026-11-20T10:14:00Z"],
    ["8 godzin i 1 minutę", "2026-11-20T08:00:00Z", "2026-11-20T16:01:00Z"]
  ])("odrzuca rezerwację trwającą %s", async (_, startTime, endTime) => {
    const { service } = setup();

    await expect(service.createReservation(booking(startTime, endTime), jakub))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

describe("cancelReservation", () => {
  test("odrzuca anulowanie rezerwacji, która już się rozpoczęła", async () => {
    const started = reservation(1, {
      startTime: new Date("2026-11-01T11:00:00Z"),
      endTime: new Date("2026-11-01T13:00:00Z")
    });
    const { service } = setup([started]);

    await expect(service.cancelReservation(1, jakub))
      .rejects.toMatchObject({ code: "RESERVATION_ALREADY_STARTED" });
  });

  test("podwójne anulowanie jest idempotentne i nie zmienia cancelledAt", async () => {
    let current = NOW;
    const { service } = setup([reservation(1)], () => current);

    const first = await service.cancelReservation(1, jakub);
    current = new Date("2026-11-02T08:00:00Z");
    const second = await service.cancelReservation(1, jakub);

    expect(second.status).toBe("CANCELLED");
    expect(second.cancelledAt).toEqual(NOW);
    expect(second.cancelledAt).toEqual(first.cancelledAt);
  });
});

describe("ownership", () => {
  test("obcy USER nie może pobrać ani anulować cudzej rezerwacji", async () => {
    const { service } = setup([reservation(1)]);

    await expect(service.getReservation(1, anna)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.cancelReservation(1, anna)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("ADMIN może anulować cudzą rezerwację", async () => {
    const { service } = setup([reservation(1)]);

    await expect(service.cancelReservation(1, admin))
      .resolves.toMatchObject({ status: "CANCELLED", cancelledAt: NOW });
  });

  test("USER widzi na liście tylko swoje rezerwacje", async () => {
    const { service } = setup([reservation(1), reservation(2, { roomId: 2, userId: anna.id })]);

    const { items, meta } = await service.listReservations({ page: 1, limit: 20, sort: "startTime" }, anna);

    expect(items.map(r => r.id)).toEqual([2]);
    expect(meta.total).toBe(1);
  });

  test("USER nie może filtrować listy po userId", async () => {
    const { service } = setup([reservation(1)]);

    await expect(service.listReservations({ page: 1, limit: 20, sort: "startTime", userId: jakub.id }, anna))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("eventy", () => {
  test("publikuje reservation.created po udanym utworzeniu rezerwacji", async () => {
    const { service, eventBus } = setup();

    const created = await service.createReservation(booking("2026-11-20T10:00:00Z", "2026-11-20T12:00:00Z"), jakub);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith("reservation.created", {
      reservationId: created.id,
      roomId: 1,
      userId: jakub.id,
      startTime: "2026-11-20T10:00:00.000Z",
      endTime: "2026-11-20T12:00:00.000Z"
    });
  });

  test("nie publikuje eventu, gdy utworzenie kończy się błędem", async () => {
    const { service, eventBus } = setup([reservation(1)]);

    await expect(service.createReservation(booking("2026-11-10T11:00:00Z", "2026-11-10T13:00:00Z"), anna))
      .rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  test("publikuje reservation.cancelled tylko przy pierwszym anulowaniu", async () => {
    const { service, eventBus } = setup([reservation(1)]);

    await service.cancelReservation(1, admin);
    await service.cancelReservation(1, admin);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith("reservation.cancelled", {
      reservationId: 1,
      roomId: 1,
      userId: jakub.id,
      cancelledBy: admin.id
    });
  });
});
