require('dotenv').config(); // Load environment variables

const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Security middleware
const {
    securityHeaders,
    hppProtection,
    addRequestId,
    requestTimeout,
    enforceHttps,
    customSecurityHeaders
} = require('./middleware/securityMiddleware');

// Session middleware
const { createSessionMiddleware } = require('./middleware/sessionMiddleware');

// Error handler
const { errorHandler } = require("./middleware/errorMiddleware");

// Logging
const { logger } = require('./utils/errorLogger');

// Security configuration
const { corsConfig } = require('./utils/securityConfig');

// Demo data seeding (optional)
const { seedTopicsIfEnabled } = require('./seeds/seedTopics');

const app = express();

// View engine (Pug)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Add request ID for tracking
app.use(addRequestId);

// Enforce HTTPS in production
app.use(enforceHttps);

// Security headers via Helmet
app.use(securityHeaders);

// Custom security headers
app.use(customSecurityHeaders);

// CORS configuration - environment-aware
const corsOpts = process.env.NODE_ENV === 'production'
    ? corsConfig.production
    : corsConfig.development;

app.use(cors(corsOpts));

// Parse JSON requests
app.use(express.json({ limit: '10kb' }));

// Page routes
app.use('/', require('./routes/pageRoutes'));

// Static assets
app.use(express.static("public"));

// Request timeout to prevent slowloris attacks
app.use(requestTimeout);

// Prevent HTTP Parameter Pollution
app.use(hppProtection);

/**
 * MongoDB Connection
 * Connects before session middleware (session store uses MongoDB)
 */
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mongo-app";

mongoose.connect(mongoURI)
    .then(async () => {
        logger.info("MongoDB Connected to " + mongoURI);

        // Optional demo data seeding (disabled by default)
        await seedTopicsIfEnabled();

        // Initialize session middleware after DB connection
        app.use(createSessionMiddleware(mongoURI));
    })
    .catch((err) => {
        logger.error("MongoDB Connection Error: " + err.message);
        process.exit(1);
    });

/**
 * Health Check Endpoint
 * Used by load balancers and monitoring systems
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));

// Handler for 404 routes
app.use((req, res) => {
    logger.warn('Route not found', {
        requestId: req.id,
        path: req.path,
        method: req.method
    });

    // API: keep JSON contract
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'Route nicht gefunden',
            path: req.path,
            requestId: req.id
        });
    }

    // Browser: user-friendly HTML
    return res.status(404).render('404', { title: 'Seite nicht gefunden', path: req.path });
});

/**
 * Error Handler Middleware
 * Must be last in middleware chain
 * Catches all errors thrown by routes and middleware
 */
app.use(errorHandler);

/**
 * Server Startup
 * Listens on specified port
 */
const PORT = process.env.PORT || 3001;

let server;
if (require.main === module) {
    server = app.listen(PORT, '0.0.0.0', () => {
        logger.info(`✅ Server läuft auf http://0.0.0.0:${PORT}`);
        logger.info(`🕒 Started at: ${new Date().toISOString()}`);
        logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    /**
     * Server Error Handler
     * Catches any errors that occur during server operation
     */
    server.on('error', (error) => {
        logger.error('❌ Server error: ' + error.message, {
            stack: error.stack
        });
    });

    /**
     * Graceful Shutdown
     * Closes connections when process terminates
     */
    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            mongoose.connection.close();
            process.exit(0);
        });
    });
}

/**
 * Uncaught Exception Handler
 * Catches any unhandled errors
 */
process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught exception: ' + error.message, {
        stack: error.stack
    });
    // In production, you might want to exit the process here
    // process.exit(1);
});

/**
 * Unhandled Promise Rejection Handler
 * Catches unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
    logger.error('⚠️ Unhandled Rejection: ' + reason, {
        promise: promise.toString()
    });
});

module.exports = app;
