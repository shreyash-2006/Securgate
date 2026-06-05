const path = require('path');
const fs = require('fs');

let db;

if (process.env.VERCEL === '1') {
    const alasql = require('alasql');
    
    // Create an in-memory database wrapper matching sqlite3 API
    db = {
        serialize: (cb) => cb(),
        prepare: (sql) => {
            return {
                run: (...args) => {
                    const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
                    try {
                        alasql(sql, args);
                        if (cb) cb(null);
                    } catch(e) {
                        if (cb) cb(e);
                    }
                },
                finalize: () => {}
            };
        },
        run: (sql, args, cb) => {
            if (typeof args === 'function') { cb = args; args = []; }
            try {
                alasql(sql, args || []);
                if (cb) cb.call({ lastID: 1, changes: 1 }, null);
            } catch(e) {
                if (cb) cb(e);
            }
        },
        all: (sql, args, cb) => {
            if (typeof args === 'function') { cb = args; args = []; }
            try {
                const res = alasql(sql, args || []);
                if (cb) cb(null, res);
            } catch(e) {
                if (cb) cb(e);
            }
        },
        get: (sql, args, cb) => {
            if (typeof args === 'function') { cb = args; args = []; }
            try {
                const res = alasql(sql, args || []);
                if (cb) cb(null, res[0] || null);
            } catch(e) {
                if (cb) cb(e);
            }
        }
    };

    // Initialize AlaSQL tables
    alasql(`CREATE TABLE IF NOT EXISTS passes (
        id STRING PRIMARY KEY, name STRING, idNumber STRING, contact STRING, 
        org STRING, purpose STRING, type STRING, allowedGates STRING, 
        allowedRooms STRING, issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
        expiresAt DATETIME, status STRING DEFAULT 'active'
    )`);
    alasql(`CREATE TABLE IF NOT EXISTS events (
        id STRING PRIMARY KEY, passId STRING, gate INTEGER, room STRING, 
        eventType STRING NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
        reason STRING
    )`);

    console.log('Connected to AlaSQL in-memory database (Vercel Mode).');

} else {
    // Local Mode with SQLite3
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, 'database.sqlite');
    
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error connecting to SQLite database:', err.message);
        } else {
            console.log('Connected to the SQLite database.');
            db.serialize(() => {
                db.run(`CREATE TABLE IF NOT EXISTS passes (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL, idNumber TEXT, contact TEXT,
                    org TEXT, purpose TEXT, type TEXT NOT NULL, allowedGates TEXT,
                    allowedRooms TEXT, issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expiresAt DATETIME, status TEXT DEFAULT 'active'
                )`);
                db.run(`CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY, passId TEXT, gate INTEGER, room TEXT,
                    eventType TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    reason TEXT, FOREIGN KEY (passId) REFERENCES passes (id)
                )`);
                console.log('Database tables initialized.');
            });
        }
    });
}

module.exports = db;
