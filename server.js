require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const pool = require('./db');

const {
    securityHeaders,
    hppProtection,
    addRequestId,
    requestTimeout,
    enforceHttps,
    customSecurityHeaders
} = require('./middleware/securityMiddleware');

const {createSessionMiddleware} = require('./middleware/sessionMiddleware');
const {errorHandler} = require('./middleware/errorMiddleware');
const {logger} = require('./utils/errorLogger');
const {corsConfig} = require('./utils/securityConfig');
const {seedTopicsIfEnabled} = require('./seeds/seedTopics');

const app = express();

app.set('trust proxy', 1);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(addRequestId);
app.use(enforceHttps);
app.use(securityHeaders);
app.use(customSecurityHeaders);

const corsOpts = process.env.NODE_ENV === 'production'
    ? corsConfig.production
    : corsConfig.development;

app.use(cors(corsOpts));
app.use(express.json({limit: '10kb'}));
app.use(createSessionMiddleware());

/**
 * PostgreSQL connection and schema initialisation
 */
const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');

pool.query(schema)
    .then(async () => {
        logger.info('PostgreSQL connected and schema ready');
        await seedTopicsIfEnabled();
    })
    .catch(err => {
        logger.error('PostgreSQL connection error: ' + err.message);
        process.exit(1);
    });

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
    if (process.env.NODE_ENV === 'test' && req.session) {
        req.session.lastHealthCheckAt = new Date().toISOString();
    }

    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use('/api', require('./routes/authRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));
app.use('/', require('./routes/pageRoutes'));
app.use(express.static('public'));

app.use((req, res) => {
    if (req.path.startsWith('/api') || !req.accepts('html')) {
        return res.status(404).json({
            success: false,
            message: 'Route nicht gefunden',
            errorCode: 'NOT_FOUND',
            details: []
        });
    }

    return res.status(404).render('404', {
        title: 'Seite nicht gefunden',
        path: req.originalUrl
    });
});

app.use(requestTimeout);
app.use(hppProtection);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

let server;
if (require.main === module) {
    server = app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server läuft auf http://0.0.0.0:${PORT}`);
        logger.info(`Started at: ${new Date().toISOString()}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', error => {
        logger.error('Server error: ' + error.message, {stack: error.stack});
    });

    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            pool.end();
            process.exit(0);
        });
    });
}

process.on('uncaughtException', error => {
    logger.error('Uncaught exception: ' + error.message, {stack: error.stack});
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection: ' + reason, {promise: promise.toString()});
});

module.exports = app;
