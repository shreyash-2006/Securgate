const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Passes Table
        db.run(`CREATE TABLE IF NOT EXISTS passes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            idNumber TEXT,
            contact TEXT,
            org TEXT,
            purpose TEXT,
            type TEXT NOT NULL,
            allowedGates TEXT,
            allowedRooms TEXT,
            issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            expiresAt DATETIME,
            status TEXT DEFAULT 'active'
        )`);

        // Events Table
        db.run(`CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            passId TEXT,
            gate INTEGER,
            room TEXT,
            eventType TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            reason TEXT,
            FOREIGN KEY (passId) REFERENCES passes (id)
        )`);
        
        console.log('Database tables initialized.');
    });
}

module.exports = db;
