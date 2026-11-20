const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");

const envFile = path.join(__dirname, "..", ".env");
const fileEnv = fs.existsSync(envFile) ? parseEnv(fs.readFileSync(envFile, "utf8")) : {};

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  ?? fileEnv.TEST_DATABASE_URL
  ?? "postgres://roombooking:change-me@localhost:5434/roombooking_test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
process.env.JWT_EXPIRES_IN = "15m";
