const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

function toEmail(name) {
  const local = name
    .trim()
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${local}@example.com`;
}

exports.up = async function (knex) {
  await knex.schema.alterTable("reservations", table => {
    table.integer("user_id").references("id").inTable("users").onDelete("RESTRICT");
    table.index("user_id");
  });

  const rows = await knex("reservations").distinct("reserved_by");

  for (const { reserved_by: name } of rows) {
    const email = toEmail(name);
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    await knex("users").insert({ email, password_hash: passwordHash, role: "USER" }).onConflict("email").ignore();
    const user = await knex("users").where({ email }).first();
    await knex("reservations").where({ reserved_by: name }).update({ user_id: user.id });
  }

  await knex.raw("ALTER TABLE reservations ALTER COLUMN user_id SET NOT NULL");
  await knex.schema.alterTable("reservations", table => {
    table.dropColumn("reserved_by");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("reservations", table => {
    table.string("reserved_by", 100);
  });

  await knex.raw("UPDATE reservations r SET reserved_by = u.email FROM users u WHERE u.id = r.user_id");
  await knex.raw("ALTER TABLE reservations ALTER COLUMN reserved_by SET NOT NULL");

  await knex.schema.alterTable("reservations", table => {
    table.dropColumn("user_id");
  });
};
