const { z } = require("zod");

const SORT_VALUES = ["startTime", "-startTime", "createdAt", "-createdAt", "participants", "-participants"];

const reservationIdParams = z.object({
  id: z.coerce.number().int().positive()
});

const listReservationsQuery = z.object({
  roomId: z.coerce.number().int().positive().optional(),
  buildingId: z.coerce.number().int().positive().optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(SORT_VALUES).default("startTime")
}).refine(query => !query.from || !query.to || new Date(query.from) < new Date(query.to), {
  message: "from must be earlier than to",
  path: ["from"]
});

const createReservationBody = z.object({
  roomId: z.number().int().positive(),
  reservedBy: z.string().trim().min(3).max(100),
  participants: z.number().int().positive(),
  startTime: z.iso.datetime({ offset: true }),
  endTime: z.iso.datetime({ offset: true })
}).strict();

module.exports = { reservationIdParams, listReservationsQuery, createReservationBody };
