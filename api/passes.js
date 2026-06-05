const { v4: uuidv4 } = require('uuid');
const db = require('../backend/database');

module.exports = (req, res) => {
    if (db._initError) {
        return res.status(500).json({ error: 'Database Initialization Failed', details: db._initError });
    }
    
    if (req.method === 'GET') {
        db.all(`SELECT * FROM passes ORDER BY issuedAt DESC`, [], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch passes' });
            const passes = rows.map(row => ({
                ...row,
                allowedGates: JSON.parse(row.allowedGates || '[]'),
                allowedRooms: JSON.parse(row.allowedRooms || '[]')
            }));
            res.json(passes);
        });
    } else if (req.method === 'POST') {
        const { name, idNumber, contact, org, purpose, type, allowedGates, allowedRooms, expiresAt } = req.body;
        const id = uuidv4();
        const gatesStr = JSON.stringify(allowedGates || []);
        const roomsStr = JSON.stringify(allowedRooms || []);

        const stmt = db.prepare(`INSERT INTO passes (id, name, idNumber, contact, org, purpose, type, allowedGates, allowedRooms, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(id, name, idNumber, contact, org, purpose, type, gatesStr, roomsStr, expiresAt, function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create pass', details: err.message || String(err) });
            res.status(201).json({ id, message: 'Pass created successfully' });
        });
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
};
