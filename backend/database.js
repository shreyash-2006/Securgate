const fs = require('fs');
const alasql = require('alasql');

// Create an in-memory database wrapper matching sqlite3 API
const db = {
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

console.log('Connected to AlaSQL database.');

module.exports = db;
