/**
 * Winston Logger Configuration
 * Provides centralized, structured logging to both console and files
 * Follows DRY principle by centralizing all logging configuration
 */

const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

/**
 * Custom format for readable timestamps and structured output
 * Separates ERROR, WARN, INFO, and DEBUG logs
 */
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        return log;
    })
);

/**
 * Main logger instance
 * - Console output for immediate visibility during development
 * - File outputs for production logs and audit trails
 * - Different log levels for different file types
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    transports: [
        // Console output - all levels
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                customFormat
            )
        }),

        // All logs file - for comprehensive audit trail
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),

        // Error logs only - for quick troubleshooting
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
            tailable: true
        })
    ]
});

/**
 * Logs authentication events for security auditing
 * Tracks: successful logins, failed attempts, token refreshes
 */
const logAuthEvent = (eventType, userId, metadata = {}) => {
    logger.info(`Auth Event: ${eventType}`, {
        eventType,
        userId,
        timestamp: new Date().toISOString(),
        ...metadata
    });
};

/**
 * Logs security events (rate limits, validation failures, etc.)
 * Important for detecting abuse patterns and security threats
 */
const logSecurityEvent = (eventType, ip, metadata = {}) => {
    logger.warn(`Security Event: ${eventType}`, {
        eventType,
        ip,
        timestamp: new Date().toISOString(),
        ...metadata
    });
};

/**
 * Logs database operations for debugging
 * Tracks query performance and error patterns
 */
const logDatabaseEvent = (operation, model, metadata = {}) => {
    logger.debug(`Database: ${operation} on ${model}`, {
        operation,
        model,
        timestamp: new Date().toISOString(),
        ...metadata
    });
};

/**
 * Logs errors with full context for debugging
 * In production, stack traces are included but not shown to clients
 */
const logError = (error, context = {}) => {
    logger.error(`Error: ${error.message}`, {
        name: error.name,
        statusCode: error.statusCode || 500,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    logger,
    logAuthEvent,
    logSecurityEvent,
    logDatabaseEvent,
    logError
};

