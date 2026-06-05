const alasql = require('alasql');

alasql(`CREATE TABLE IF NOT EXISTS passes (
    id STRING PRIMARY KEY, name STRING, idNumber STRING, contact STRING, 
    org STRING, purpose STRING, type STRING, allowedGates STRING, 
    allowedRooms STRING, issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
    expiresAt DATETIME, status STRING DEFAULT 'active'
)`);

try {
    alasql(`INSERT INTO passes (id, name, idNumber, contact, org, purpose, type, allowedGates, allowedRooms, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['123', 'John', 'ID1', '', '', '', 'visitor', '[]', '[]', '2026-06-05']);
    console.log("Success");
} catch(e) {
    console.log("Error:", e.message);
}
