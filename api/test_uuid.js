const { v4: uuidv4 } = require('uuid');
module.exports = (req, res) => {
    res.json({ success: true, uuidv4: typeof uuidv4 });
};
