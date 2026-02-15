/**
 * Security Middleware
 * Combines multiple security measures into a unified middleware stack
 * Protects against common web vulnerabilities
 */

const helmet = require('helmet');
const hpp = require('hpp');
const { helmetConfig, corsConfig } = require('../utils/securityConfig');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/errorLogger');

/**
 * Helmet middleware for HTTP security headers
 * Protects against:
 * - Clickjacking (X-Frame-Options)
 * - XSS attacks (X-XSS-Protection, CSP)
 * - MIME type sniffing (X-Content-Type-Options)
 * - Insecure protocol usage (HSTS)
 */
const securityHeaders = helmet(helmetConfig);

/**
 * HTTP Parameter Pollution prevention
 * Removes duplicate parameters to prevent HPP attacks
 * Keeps only the last value if multiple values provided
 */
const hppProtection = hpp({
    whitelist: [
        'sort',
        'fields',
        'page',
        'limit',
        'kurs' // Allow multiple kurs values if needed
    ]
});

/**
 * Request ID middleware
 * Adds unique ID to each request for audit trail and debugging
 * Useful for tracing requests through logs
 */
const addRequestId = (req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);

    logger.debug(`Request received`, {
        requestId: req.id,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    next();
};

/**
 * Request timeout middleware
 * Prevents slow client attacks (slowloris)
 * Sets maximum time allowed for request completion
 */
const requestTimeout = (req, res, next) => {
    // Set timeout to 30 seconds
    req.setTimeout(30000, () => {
        res.status(408).json({
            success: false,
            message: 'Request timeout',
            requestId: req.id
        });
    });

    next();
};

/**
 * HTTPS enforcement middleware
 * Redirects HTTP to HTTPS in production
 * Ensures all communication is encrypted
 */
const enforceHttps = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
        logger.warn('Non-HTTPS request in production', {
            requestId: req.id,
            ip: req.ip
        });
        return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
};

/**
 * Custom security headers middleware
 * Adds additional custom headers for enhanced security
 */
const customSecurityHeaders = (req, res, next) => {
    // Prevent browsers from MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter in legacy browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Remove server identification
    res.setHeader('X-Powered-By', 'Secure API');

    next();
};

module.exports = {
    securityHeaders,
    hppProtection,
    addRequestId,
    requestTimeout,
    enforceHttps,
    customSecurityHeaders
};


