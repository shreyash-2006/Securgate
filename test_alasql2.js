const alasql = require('alasql');

alasql(`CREATE TABLE IF NOT EXISTS passes (
    id STRING PRIMARY KEY, name STRING, idNumber STRING, contact STRING, 
    org STRING, purpose STRING, type STRING, allowedGates STRING, 
    allowedRooms STRING, issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP, 
    expiresAt DATETIME, status STRING DEFAULT 'active'
)`);

const db = {
    prepare: (sql) => {
        return {
            run: (...args) => {
                const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
                try {
                    console.log('Running alasql with args:', args);
                    alasql(sql, args);
                    if (cb) cb(null);
                } catch(e) {
                    console.log('Caught error in run:', e);
                    if (cb) cb(e);
                }
            },
            finalize: () => {}
        };
    }
};

const stmt = db.prepare(`INSERT INTO passes (id, name, idNumber, contact, org, purpose, type, allowedGates, allowedRooms, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const cb = (err) => {
    if (err) console.log("Callback error:", err.message);
    else console.log("Success");
};
stmt.run("1", "John", "123", "", "", "", "visitor", "[]", "[]", "2026", cb);
