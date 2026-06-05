const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontends
const path = require('path');
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.use('/user', express.static(path.join(__dirname, '../public/user')));

// Redirect root to user portal
app.get('/', (req, res) => {
    res.redirect('/user');
});

// --- ROUTES FOR PASSES ---

app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', url: req.url, originalUrl: req.originalUrl });
});

// Create a new pass
app.post('/api/passes', (req, res) => {
    const { name, idNumber, contact, org, purpose, type, allowedGates, allowedRooms, expiresAt } = req.body;
    const id = uuidv4();
    
    // Convert arrays to JSON strings for SQLite
    const gatesStr = JSON.stringify(allowedGates || []);
    const roomsStr = JSON.stringify(allowedRooms || []);

    const stmt = db.prepare(`INSERT INTO passes (id, name, idNumber, contact, org, purpose, type, allowedGates, allowedRooms, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(id, name, idNumber, contact, org, purpose, type, gatesStr, roomsStr, expiresAt, function(err) {
        if (err) {
            console.error('Error creating pass:', err);
            return res.status(500).json({ error: 'Failed to create pass' });
        }
        res.status(201).json({ id, message: 'Pass created successfully' });
    });
    stmt.finalize();
});

// Get all passes
app.get('/api/passes', (req, res) => {
    db.all(`SELECT * FROM passes ORDER BY issuedAt DESC`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching passes:', err);
            return res.status(500).json({ error: 'Failed to fetch passes' });
        }
        // Parse JSON strings back to arrays
        const passes = rows.map(row => ({
            ...row,
            allowedGates: JSON.parse(row.allowedGates || '[]'),
            allowedRooms: JSON.parse(row.allowedRooms || '[]')
        }));
        res.json(passes);
    });
});

// Get a specific pass by ID
app.get('/api/passes/:id', (req, res) => {
    db.get(`SELECT * FROM passes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Pass not found' });
        
        row.allowedGates = JSON.parse(row.allowedGates || '[]');
        row.allowedRooms = JSON.parse(row.allowedRooms || '[]');
        res.json(row);
    });
});

// Update pass status (revoke)
app.patch('/api/passes/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE passes SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update status' });
        res.json({ message: 'Status updated' });
    });
});

// --- ROUTES FOR EVENTS (SCANNING) ---

// Log a new scan event
app.post('/api/events/scan', (req, res) => {
    const { passId, gate, room, type: scanType } = req.body;
    // scanType should be 'gate' or 'room'

    // First check if pass is valid
    db.get(`SELECT * FROM passes WHERE id = ?`, [passId], (err, pass) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!pass) return res.status(404).json({ error: 'Invalid Pass: Not found', allowed: false });
        
        if (pass.status !== 'active') {
            logEvent(passId, gate, room, 'denied', 'Pass is ' + pass.status);
            return res.json({ allowed: false, reason: 'Pass is ' + pass.status, pass });
        }

        const now = new Date();
        if (pass.expiresAt && new Date(pass.expiresAt) < now) {
            logEvent(passId, gate, room, 'denied', 'Pass expired');
            return res.json({ allowed: false, reason: 'Pass expired', pass });
        }

        // Check gate/room permissions
        if (scanType === 'gate') {
            const allowedGates = JSON.parse(pass.allowedGates || '[]');
            if (allowedGates.length > 0 && !allowedGates.includes(gate)) {
                logEvent(passId, gate, null, 'denied', 'Not allowed at this gate');
                return res.json({ allowed: false, reason: `Not allowed at Gate ${gate}`, pass });
            }
            
            // Toggle entry/exit logic based on last event
            db.get(`SELECT eventType FROM events WHERE passId = ? AND (eventType = 'gate_entry' OR eventType = 'gate_exit') ORDER BY timestamp DESC LIMIT 1`, [passId], (err, lastEvent) => {
                const newEventType = (lastEvent && lastEvent.eventType === 'gate_entry') ? 'gate_exit' : 'gate_entry';
                logEvent(passId, gate, null, newEventType, null);
                res.json({ allowed: true, eventType: newEventType, pass });
            });

        } else if (scanType === 'room') {
            const allowedRooms = JSON.parse(pass.allowedRooms || '[]');
            if (allowedRooms.length > 0 && !allowedRooms.includes(room)) {
                logEvent(passId, null, room, 'denied', 'Not allowed in this room');
                return res.json({ allowed: false, reason: `Not allowed in ${room}`, pass });
            }
            
            db.get(`SELECT eventType FROM events WHERE passId = ? AND room = ? AND (eventType = 'room_entry' OR eventType = 'room_exit') ORDER BY timestamp DESC LIMIT 1`, [passId, room], (err, lastEvent) => {
                const newEventType = (lastEvent && lastEvent.eventType === 'room_entry') ? 'room_exit' : 'room_entry';
                logEvent(passId, null, room, newEventType, null);
                res.json({ allowed: true, eventType: newEventType, pass });
            });
        } else {
             res.status(400).json({ error: 'Invalid scan type' });
        }
    });
});

function logEvent(passId, gate, room, eventType, reason) {
    const id = uuidv4();
    db.run(`INSERT INTO events (id, passId, gate, room, eventType, reason) VALUES (?, ?, ?, ?, ?, ?)`, 
        [id, passId, gate, room, eventType, reason], 
        (err) => {
            if (err) console.error('Error logging event:', err);
        });
}

// Get all events
app.get('/api/events', (req, res) => {
    db.all(`
        SELECT e.*, p.name as passengerName, p.type as passType 
        FROM events e 
        LEFT JOIN passes p ON e.passId = p.id 
        ORDER BY e.timestamp DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// --- ROUTES FOR DASHBOARD STATS ---
app.get('/api/stats', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const queries = {
        totalActive: `SELECT COUNT(*) as count FROM passes WHERE status = 'active'`,
        entriesToday: `SELECT COUNT(*) as count FROM events WHERE eventType = 'gate_entry' AND timestamp LIKE '${today}%'`,
        exitsToday: `SELECT COUNT(*) as count FROM events WHERE eventType = 'gate_exit' AND timestamp LIKE '${today}%'`,
        gateStatus: `
            SELECT e.gate, COUNT(CASE WHEN e.eventType = 'gate_entry' THEN 1 END) - COUNT(CASE WHEN e.eventType = 'gate_exit' THEN 1 END) as occupancy
            FROM events e
            WHERE e.gate IS NOT NULL
            GROUP BY e.gate
        `
    };

    let stats = {};
    db.serialize(() => {
        db.get(queries.totalActive, [], (err, row) => stats.totalActive = row ? row.count : 0);
        db.get(queries.entriesToday, [], (err, row) => stats.entriesToday = row ? row.count : 0);
        db.get(queries.exitsToday, [], (err, row) => stats.exitsToday = row ? row.count : 0);
        db.all(queries.gateStatus, [], (err, rows) => {
            stats.gateOccupancy = rows || [];
            res.json(stats);
        });
    });
});


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
