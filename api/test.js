const db = require('../backend/database');
module.exports = (req, res) => {
    res.json({ success: true, dbType: typeof db });
};
