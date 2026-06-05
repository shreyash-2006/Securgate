const alasql = require('alasql');
module.exports = (req, res) => {
    res.json({ message: 'ping isolated', alasql: typeof alasql });
};
