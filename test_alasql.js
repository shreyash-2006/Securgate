const alasql = require('alasql');

alasql(`CREATE TABLE IF NOT EXISTS events (
    id STRING PRIMARY KEY,
    passId STRING,
    gate INTEGER,
    room STRING,
    eventType STRING NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason STRING
)`);

alasql(`INSERT INTO events (id, passId, gate, room, eventType, reason) VALUES (?, ?, ?, ?, ?, ?)`, ['1', 'p1', 1, null, 'gate_entry', null]);
alasql(`INSERT INTO events (id, passId, gate, room, eventType, reason) VALUES (?, ?, ?, ?, ?, ?)`, ['2', 'p1', 1, null, 'gate_exit', null]);

let res = alasql(`
    SELECT e.gate, COUNT(CASE WHEN e.eventType = 'gate_entry' THEN 1 END) - COUNT(CASE WHEN e.eventType = 'gate_exit' THEN 1 END) as occupancy
    FROM events e
    WHERE e.gate IS NOT NULL
    GROUP BY e.gate
`);

console.log('Occupancy:', res);

let res2 = alasql(`SELECT * FROM events ORDER BY timestamp DESC`);
console.log('Events:', res2);
