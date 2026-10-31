const { AppError } = require("../errors/AppError");

const DB_ERRORS = {
  "23505": { status: 409, code: "ALREADY_EXISTS", message: "Resource already exists" },
  "23503": { status: 409, code: "RESOURCE_IN_USE", message: "Resource is referenced by other data" },
  "23514": { status: 400, code: "CHECK_VIOLATION", message: "Data violates a database rule" },
  "23P01": { status: 409, code: "ROOM_ALREADY_BOOKED", message: "Room is already booked for this time" }
};

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.id
      }
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON", requestId: req.id }
    });
  }

  const dbError = DB_ERRORS[err.code];

  if (dbError) {
    return res.status(dbError.status).json({
      error: { code: dbError.code, message: dbError.message, requestId: req.id }
    });
  }

  console.error(`[${req.id}]`, err);

  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Unexpected error", requestId: req.id }
  });
}

module.exports = errorHandler;
