const bcrypt = require("bcryptjs");

const USERS = [
  { email: "admin@example.com", password: "admin-password-123", role: "ADMIN" },
  { email: "jakub.sosnowski@example.com", password: "jakub-password-123", role: "USER" },
  { email: "anna.nowak@example.com", password: "anna-password-123", role: "USER" }
];

exports.seed = async function (knex) {
  await knex.raw("TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE");

  const rows = await Promise.all(USERS.map(async user => ({
    email: user.email,
    password_hash: await bcrypt.hash(user.password, 12),
    role: user.role,
    created_at: "2026-10-25T10:00:00Z"
  })));

  await knex("users").insert(rows);
};
