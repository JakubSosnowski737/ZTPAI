const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ConflictError, UnauthorizedError, NotFoundError } = require("../../errors/AppError");

const BCRYPT_ROUNDS = 12;

function createAuthService({ runInTransaction, jwtSecret, jwtExpiresIn }) {
  async function register({ email, password }) {
    return runInTransaction(async ({ users }) => {
      const existing = await users.findByEmail(email);
      if (existing) throw new ConflictError("Email already registered", "EMAIL_TAKEN");

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      return users.create({ email, passwordHash, role: "USER" });
    });
  }

  async function login({ email, password }) {
    const user = await runInTransaction(({ users }) => users.findByEmail(email));
    const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!passwordOk) throw new UnauthorizedError("Invalid email or password");

    const accessToken = jwt.sign({ role: user.role }, jwtSecret, {
      subject: String(user.id),
      expiresIn: jwtExpiresIn,
      algorithm: "HS256"
    });

    return { accessToken, tokenType: "Bearer", expiresIn: jwtExpiresIn };
  }

  async function getCurrentUser(currentUser) {
    return runInTransaction(async ({ users }) => {
      const user = await users.findById(currentUser.id);
      if (!user) throw new NotFoundError("User");
      return user;
    });
  }

  return { register, login, getCurrentUser };
}

module.exports = { createAuthService };
