try {
    const app = require('../backend/server.js');
    module.exports = app;
} catch (err) {
    const express = require('express');
    const fallbackApp = express();
    fallbackApp.all('*', (req, res) => {
        res.status(500).json({
            error: 'Server Initialization Failed',
            message: err.message,
            stack: err.stack
        });
    });
    module.exports = fallbackApp;
}
