const express = require('express');
require('dotenv').config({ override: true });
const path = require('path');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Use structured routes
app.use('/', routes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Erro interno no servidor',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
