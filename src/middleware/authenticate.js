const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors/AppError");

function authenticate(jwtSecret) {
  return (req, res, next) => {
    const header = req.get("Authorization");
    if (!header) return next(new UnauthorizedError());

    const [scheme, token, ...rest] = header.split(" ");
    if (scheme !== "Bearer" || !token || rest.length > 0) {
      return next(new UnauthorizedError("Authorization header must be: Bearer <token>"));
    }

    try {
      const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
      req.user = { id: Number(payload.sub), role: payload.role };
      next();
    } catch (err) {
      const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      next(new UnauthorizedError(message));
    }
  };
}

module.exports = authenticate;
