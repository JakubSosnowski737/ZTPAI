exports.seed = async function (knex) {
  const createdAt = "2026-10-25T10:00:00Z";

  await knex("buildings").insert([
    { name: "Budynek A", address: "ul. Warszawska 24, Kraków", created_at: createdAt },
    { name: "Budynek B", address: "al. Mickiewicza 30, Kraków", created_at: createdAt },
    { name: "Budynek C", address: "ul. Podchorążych 2, Kraków", created_at: createdAt }
  ]);

  await knex("rooms").insert([
    { building_id: 1, name: "101", capacity: 30, created_at: createdAt },
    { building_id: 1, name: "102", capacity: 20, created_at: createdAt },
    { building_id: 1, name: "201", capacity: 50, created_at: createdAt },
    { building_id: 2, name: "101", capacity: 100, created_at: createdAt },
    { building_id: 2, name: "Aula", capacity: 200, created_at: createdAt }
  ]);

  await knex("reservations").insert([
    {
      room_id: 1,
      user_id: 2,
      participants: 20,
      start_time: "2026-11-10T10:00:00Z",
      end_time: "2026-11-10T12:00:00Z",
      status: "CONFIRMED",
      created_at: createdAt
    },
    {
      room_id: 1,
      user_id: 3,
      participants: 25,
      start_time: "2026-11-10T12:00:00Z",
      end_time: "2026-11-10T13:00:00Z",
      status: "CONFIRMED",
      created_at: createdAt
    },
    {
      room_id: 2,
      user_id: 2,
      participants: 15,
      start_time: "2026-11-12T09:00:00Z",
      end_time: "2026-11-12T10:30:00Z",
      status: "CANCELLED",
      cancelled_at: "2026-10-28T09:00:00Z",
      created_at: createdAt
    },
    {
      room_id: 4,
      user_id: 3,
      participants: 80,
      start_time: "2026-10-20T08:00:00Z",
      end_time: "2026-10-20T10:00:00Z",
      status: "CONFIRMED",
      created_at: "2026-10-10T10:00:00Z"
    },
    {
      room_id: 5,
      user_id: 2,
      participants: 150,
      start_time: "2026-11-15T14:00:00Z",
      end_time: "2026-11-15T16:00:00Z",
      status: "CONFIRMED",
      created_at: createdAt
    }
  ]);
};
