const ref = name => ({ $ref: `#/components/schemas/${name}` });
const REQUEST_ID = "8f14e45f-ceea-467a-9575-4c3f6c1d2a90";
const json = (schema, example) => ({ "application/json": example ? { schema, example } : { schema } });
const ok = (description, schema) => ({ description, content: json(schema) });
const error = (description, code, message, details) => ({
  description,
  content: json(ref("Error"), { error: { code, message, details, requestId: REQUEST_ID } })
});
const body = name => ({ required: true, content: json(ref(name)) });
const idParam = description => ({
  name: "id",
  in: "path",
  required: true,
  description,
  schema: { type: "integer", minimum: 1 }
});
const queryParam = (name, description, schema) => ({ name, in: "query", required: false, description, schema });

const E400 = error("Validation error (wrong body, query or path parameter)", "VALIDATION_ERROR", "Validation failed", [
  { location: "body", field: "roomId", message: "Invalid input: expected number, received string" }
]);
const E401 = error("Missing, malformed, invalid or expired token", "UNAUTHORIZED", "Token expired");
const E403 = error("Logged in, but the role is not allowed (ADMIN only)", "FORBIDDEN", "Insufficient permissions");

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Room Booking API",
    version: "4.0.0",
    description: "Room Booking API z zadania 04 - Jakub Sosnowski"
  },
  tags: [
    { name: "Auth" },
    { name: "Buildings" },
    { name: "Rooms" },
    { name: "Reservations" }
  ],
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new USER account",
        security: [],
        requestBody: body("RegisterRequest"),
        responses: {
          201: ok("Created user", ref("User")),
          400: E400,
          409: error("Email already registered", "EMAIL_TAKEN", "Email already registered")
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and get a JWT access token",
        security: [],
        requestBody: body("LoginRequest"),
        responses: {
          200: ok("Access token", ref("LoginResponse")),
          400: E400,
          401: error("Invalid email or password", "UNAUTHORIZED", "Invalid email or password")
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        responses: {
          200: ok("Logged in user", ref("User")),
          401: E401,
          404: error("User from the token no longer exists", "NOT_FOUND", "User not found")
        }
      }
    },
    "/api/buildings": {
      get: {
        tags: ["Buildings"],
        summary: "List buildings with roomsCount",
        responses: {
          200: ok("Buildings", { type: "array", items: ref("Building") }),
          401: E401
        }
      },
      post: {
        tags: ["Buildings"],
        summary: "Create a building (ADMIN)",
        requestBody: body("BuildingCreate"),
        responses: {
          201: ok("Created building", ref("Building")),
          400: E400,
          401: E401,
          403: E403,
          409: error("Building name already exists", "ALREADY_EXISTS", "Resource already exists")
        }
      }
    },
    "/api/buildings/{id}": {
      get: {
        tags: ["Buildings"],
        summary: "Get a building",
        parameters: [idParam("Building ID")],
        responses: {
          200: ok("Building", ref("Building")),
          400: E400,
          401: E401,
          404: error("Building not found", "NOT_FOUND", "Building not found")
        }
      },
      patch: {
        tags: ["Buildings"],
        summary: "Update a building (ADMIN)",
        parameters: [idParam("Building ID")],
        requestBody: body("BuildingUpdate"),
        responses: {
          200: ok("Updated building", ref("Building")),
          400: E400,
          401: E401,
          403: E403,
          404: error("Building not found", "NOT_FOUND", "Building not found"),
          409: error("Building name already exists", "ALREADY_EXISTS", "Resource already exists")
        }
      },
      delete: {
        tags: ["Buildings"],
        summary: "Delete a building without rooms (ADMIN)",
        parameters: [idParam("Building ID")],
        responses: {
          204: { description: "Building deleted" },
          400: E400,
          401: E401,
          403: E403,
          404: error("Building not found", "NOT_FOUND", "Building not found"),
          409: error("Building still has rooms", "BUILDING_HAS_ROOMS", "Building still has rooms")
        }
      }
    },
    "/api/buildings/{id}/rooms": {
      get: {
        tags: ["Buildings"],
        summary: "List rooms of a building",
        parameters: [idParam("Building ID")],
        responses: {
          200: ok("Rooms of the building (empty array if none)", { type: "array", items: ref("Room") }),
          400: E400,
          401: E401,
          404: error("Building not found", "NOT_FOUND", "Building not found")
        }
      }
    },
    "/api/rooms": {
      get: {
        tags: ["Rooms"],
        summary: "List rooms",
        responses: {
          200: ok("Rooms", { type: "array", items: ref("Room") }),
          401: E401
        }
      },
      post: {
        tags: ["Rooms"],
        summary: "Create a room (ADMIN)",
        requestBody: body("RoomCreate"),
        responses: {
          201: ok("Created room", ref("Room")),
          400: E400,
          401: E401,
          403: E403,
          404: error("Building not found", "NOT_FOUND", "Building not found"),
          409: error("Room name already exists in this building", "ALREADY_EXISTS", "Resource already exists")
        }
      }
    },
    "/api/rooms/{id}": {
      get: {
        tags: ["Rooms"],
        summary: "Get a room with its building",
        parameters: [idParam("Room ID")],
        responses: {
          200: ok("Room", ref("Room")),
          400: E400,
          401: E401,
          404: error("Room not found", "NOT_FOUND", "Room not found")
        }
      },
      patch: {
        tags: ["Rooms"],
        summary: "Update a room (ADMIN)",
        parameters: [idParam("Room ID")],
        requestBody: body("RoomUpdate"),
        responses: {
          200: ok("Updated room", ref("Room")),
          400: E400,
          401: E401,
          403: E403,
          404: error("Room not found", "NOT_FOUND", "Room not found"),
          409: error("Room name already exists in this building", "ALREADY_EXISTS", "Resource already exists")
        }
      },
      delete: {
        tags: ["Rooms"],
        summary: "Delete a room without reservations (ADMIN)",
        parameters: [idParam("Room ID")],
        responses: {
          204: { description: "Room deleted" },
          400: E400,
          401: E401,
          403: E403,
          404: error("Room not found", "NOT_FOUND", "Room not found"),
          409: error("Room still has reservations", "ROOM_HAS_RESERVATIONS", "Room still has reservations")
        }
      }
    },
    "/api/reservations": {
      get: {
        tags: ["Reservations"],
        summary: "List reservations (USER sees only own, ADMIN sees all)",
        parameters: [
          queryParam("roomId", "Only reservations of this room", { type: "integer", minimum: 1 }),
          queryParam("buildingId", "Only reservations of rooms in this building", { type: "integer", minimum: 1 }),
          queryParam("userId", "Only reservations of this user (ADMIN only, USER gets 403)", { type: "integer", minimum: 1 }),
          queryParam("status", "Reservation status", { type: "string", enum: ["CONFIRMED", "CANCELLED"] }),
          queryParam("from", "Reservations overlapping [from, to)", { type: "string", format: "date-time" }),
          queryParam("to", "Reservations overlapping [from, to)", { type: "string", format: "date-time" }),
          queryParam("page", "Page number", { type: "integer", minimum: 1, default: 1 }),
          queryParam("limit", "Page size", { type: "integer", minimum: 1, maximum: 100, default: 20 }),
          queryParam("sort", "Sort order", {
            type: "string",
            enum: ["startTime", "-startTime", "createdAt", "-createdAt", "participants", "-participants"],
            default: "startTime"
          })
        ],
        responses: {
          200: ok("Page of reservations", ref("ReservationList")),
          400: E400,
          401: E401,
          403: error("USER tried to use the userId filter", "FORBIDDEN", "Only ADMIN can filter reservations by userId")
        }
      },
      post: {
        tags: ["Reservations"],
        summary: "Create a reservation for the logged in user",
        requestBody: body("ReservationCreate"),
        responses: {
          201: ok("Created reservation", ref("Reservation")),
          400: E400,
          401: E401,
          404: error("Room not found", "NOT_FOUND", "Room not found"),
          409: error("Room already booked (ROOM_ALREADY_BOOKED) or capacity exceeded (ROOM_CAPACITY_EXCEEDED)", "ROOM_ALREADY_BOOKED", "Room is already booked for this time")
        }
      }
    },
    "/api/reservations/{id}": {
      get: {
        tags: ["Reservations"],
        summary: "Get a reservation (owner or ADMIN)",
        parameters: [idParam("Reservation ID")],
        responses: {
          200: ok("Reservation", ref("Reservation")),
          400: E400,
          401: E401,
          404: error("Reservation not found or it belongs to another user", "NOT_FOUND", "Reservation not found")
        }
      }
    },
    "/api/reservations/{id}/cancel": {
      patch: {
        tags: ["Reservations"],
        summary: "Cancel a reservation (owner or ADMIN)",
        parameters: [idParam("Reservation ID")],
        responses: {
          200: ok("Cancelled reservation", ref("Reservation")),
          400: E400,
          401: E401,
          404: error("Reservation not found or it belongs to another user", "NOT_FOUND", "Reservation not found"),
          409: error("Reservation has already started", "RESERVATION_ALREADY_STARTED", "Reservation has already started")
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    location: { type: "string", enum: ["params", "query", "body"] },
                    field: { type: "string" },
                    message: { type: "string" }
                  }
                }
              },
              requestId: { type: "string" }
            }
          }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 4 },
          email: { type: "string", format: "email", example: "jan.kowalski@example.com" },
          role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "Jan.Kowalski@example.com" },
          password: { type: "string", minLength: 10, maxLength: 72, example: "bardzo-dlugie-haslo" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "jan.kowalski@example.com" },
          password: { type: "string", example: "bardzo-dlugie-haslo" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "string", example: "15m" }
        }
      },
      BuildingRef: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Budynek A" }
        }
      },
      Building: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Budynek A" },
          address: { type: "string", example: "ul. Warszawska 24, Kraków" },
          roomsCount: { type: "integer", example: 3, description: "Only in GET /api/buildings" }
        }
      },
      BuildingCreate: {
        type: "object",
        required: ["name", "address"],
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100, example: "Budynek D" },
          address: { type: "string", minLength: 3, maxLength: 200, example: "ul. Jana Pawła II 37, Kraków" }
        }
      },
      BuildingUpdate: {
        type: "object",
        minProperties: 1,
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100, example: "Budynek D2" },
          address: { type: "string", minLength: 3, maxLength: 200, example: "ul. Jana Pawła II 39, Kraków" }
        }
      },
      Room: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "101" },
          capacity: { type: "integer", example: 30 },
          building: ref("BuildingRef")
        }
      },
      RoomCreate: {
        type: "object",
        required: ["buildingId", "name", "capacity"],
        additionalProperties: false,
        properties: {
          buildingId: { type: "integer", minimum: 1, example: 3 },
          name: { type: "string", minLength: 1, maxLength: 50, example: "C1" },
          capacity: { type: "integer", minimum: 1, example: 25 }
        }
      },
      RoomUpdate: {
        type: "object",
        minProperties: 1,
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50, example: "C1" },
          capacity: { type: "integer", minimum: 1, example: 35 }
        }
      },
      Reservation: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          room: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "101" },
              building: ref("BuildingRef")
            }
          },
          user: {
            type: "object",
            properties: {
              id: { type: "integer", example: 2 },
              email: { type: "string", format: "email", example: "jakub.sosnowski@example.com" }
            }
          },
          participants: { type: "integer", example: 20 },
          startTime: { type: "string", format: "date-time", example: "2026-11-10T10:00:00.000Z" },
          endTime: { type: "string", format: "date-time", example: "2026-11-10T12:00:00.000Z" },
          status: { type: "string", enum: ["CONFIRMED", "CANCELLED"] },
          createdAt: { type: "string", format: "date-time" },
          cancelledAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      ReservationCreate: {
        type: "object",
        required: ["roomId", "participants", "startTime", "endTime"],
        additionalProperties: false,
        properties: {
          roomId: { type: "integer", minimum: 1, example: 3 },
          participants: { type: "integer", minimum: 1, example: 10 },
          startTime: { type: "string", format: "date-time", example: "2026-11-25T10:00:00Z" },
          endTime: { type: "string", format: "date-time", example: "2026-11-25T12:00:00Z" }
        }
      },
      ReservationList: {
        type: "object",
        properties: {
          data: { type: "array", items: ref("Reservation") },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 20 },
              total: { type: "integer", example: 3 },
              totalPages: { type: "integer", example: 1 }
            }
          }
        }
      }
    }
  }
};
