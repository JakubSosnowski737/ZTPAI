\echo '=== UNIQUE buildings.name ==='
INSERT INTO buildings (name, address) VALUES ('Budynek A', 'ul. Testowa 1, Kraków');

\echo '=== UNIQUE rooms (building_id, name) ==='
INSERT INTO rooms (building_id, name, capacity) VALUES (1, '101', 30);

\echo '=== CHECK rooms.capacity > 0 ==='
INSERT INTO rooms (building_id, name, capacity) VALUES (1, '999', 0);

\echo '=== NOT NULL rooms.name ==='
INSERT INTO rooms (building_id, name, capacity) VALUES (1, NULL, 30);

\echo '=== FOREIGN KEY rooms.building_id ==='
INSERT INTO rooms (building_id, name, capacity) VALUES (99, '101', 30);

\echo '=== FOREIGN KEY reservations.room_id ==='
INSERT INTO reservations (room_id, reserved_by, participants, start_time, end_time)
VALUES (99, 'Jakub Sosnowski', 10, '2026-12-01T10:00:00Z', '2026-12-01T12:00:00Z');

\echo '=== CHECK reservations.participants > 0 ==='
INSERT INTO reservations (room_id, reserved_by, participants, start_time, end_time)
VALUES (1, 'Jakub Sosnowski', 0, '2026-12-01T10:00:00Z', '2026-12-01T12:00:00Z');

\echo '=== CHECK reservations.end_time > start_time ==='
INSERT INTO reservations (room_id, reserved_by, participants, start_time, end_time)
VALUES (1, 'Jakub Sosnowski', 10, '2026-12-01T12:00:00Z', '2026-12-01T10:00:00Z');

\echo '=== CHECK reservations.status ==='
INSERT INTO reservations (room_id, reserved_by, participants, start_time, end_time, status)
VALUES (1, 'Jakub Sosnowski', 10, '2026-12-01T10:00:00Z', '2026-12-01T12:00:00Z', 'PENDING');

\echo '=== EXCLUDE reservations_no_overlap ==='
INSERT INTO reservations (room_id, reserved_by, participants, start_time, end_time)
VALUES (1, 'Jakub Sosnowski', 10, '2026-11-10T11:00:00Z', '2026-11-10T11:30:00Z');

\echo '=== ON DELETE RESTRICT: budynek z salami ==='
DELETE FROM buildings WHERE id = 1;

\echo '=== ON DELETE RESTRICT: sala z rezerwacjami ==='
DELETE FROM rooms WHERE id = 1;

\echo '=== EXCLUDE przepuszcza rezerwacje stykajace sie i nakladajace sie na CANCELLED ==='
BEGIN;
INSERT INTO reservations (room_id, reserved_by, participants, start_time, end_time)
VALUES (1, 'Jakub Sosnowski', 10, '2026-11-10T13:00:00Z', '2026-11-10T14:00:00Z');
INSERT INTO reservations (room_id, reserved_by, participants, start_time, end_time)
VALUES (2, 'Jakub Sosnowski', 10, '2026-11-12T09:00:00Z', '2026-11-12T10:30:00Z');
SELECT id, room_id, start_time, end_time, status FROM reservations WHERE room_id IN (1, 2) ORDER BY room_id, start_time, id;
ROLLBACK;
