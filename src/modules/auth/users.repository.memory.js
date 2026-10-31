const createdAt = new Date("2026-10-25T10:00:00.000Z");

const usersSeed = [
  {
    id: 1,
    email: "admin@example.com",
    passwordHash: "$2b$12$Hp/pdKKe3PE0am8wrMvwTe.ZWd4jcF7zMi/PqULYnBLKRv93w3Jve",
    role: "ADMIN",
    createdAt
  },
  {
    id: 2,
    email: "jakub.sosnowski@example.com",
    passwordHash: "$2b$12$XhELIxglU3AtzYWNJXCcLOXmw9fkrEXfnWounGcYAraTKiphpBtR2",
    role: "USER",
    createdAt
  },
  {
    id: 3,
    email: "anna.nowak@example.com",
    passwordHash: "$2b$12$M4M7hpH6FcsdnXQbM7h6KO350IcWFU76b0qvisFu2kcs5TOrfiXk6",
    role: "USER",
    createdAt
  }
];

function createUsersRepository(store) {
  let nextId = Math.max(0, ...store.users.map(u => u.id)) + 1;

  async function findById(id) {
    return store.users.find(u => u.id === id) ?? null;
  }

  async function findByEmail(email) {
    return store.users.find(u => u.email === email) ?? null;
  }

  async function create({ email, passwordHash, role }) {
    const user = { id: nextId++, email, passwordHash, role, createdAt: new Date() };
    store.users.push(user);
    return user;
  }

  return { findById, findByEmail, create };
}

module.exports = { usersSeed, createUsersRepository };
