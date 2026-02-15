/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request frequency per IP and per user
 * Uses express-rate-limit to enforce rate limits
 */

const rateLimit = require('express-rate-limit');
const { rateLimitConfig } = require('../utils/securityConfig');
const { logSecurityEvent } = require('../utils/errorLogger');

/**
 * General API rate limiter
 * Applied to all API endpoints
 * Limits: 100 requests per 15 minutes per IP
 */
const isTestEnv = process.env.NODE_ENV === 'test';
const passthroughLimiter = (req, res, next) => next();
const shouldSkipRateLimit = (req) => isTestEnv || req.get('X-Test-Run') === '1';

const generalLimiter = shouldSkipRateLimit ? passthroughLimiter : rateLimit({
    windowMs: rateLimitConfig.general.windowMs,
    max: rateLimitConfig.general.max,
    message: rateLimitConfig.general.message,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers

    // Custom skip logic
    skip: (req) => {
        // Skip rate limiting for health checks
        if (req.path === '/health') return true;
        return false;
    },

    // Handler for rate limit exceeded
    handler: (req, res) => {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', req.ip, {
            endpoint: req.path,
            method: req.method
        });
        res.status(429).json({
            success: false,
            message: rateLimitConfig.general.message,
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * Authentication rate limiter (stricter)
 * Applied to /login and /registration endpoints
 * Limits: 5 attempts per 15 minutes per IP
 * Only counts failed attempts (successful requests exempt)
 */
const authLimiter = shouldSkipRateLimit ? passthroughLimiter : rateLimit({
    windowMs: rateLimitConfig.auth.windowMs,
    max: rateLimitConfig.auth.max,
    message: rateLimitConfig.auth.message,
    skipSuccessfulRequests: rateLimitConfig.auth.skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', req.ip, {
            endpoint: req.path,
            method: req.method,
            username: req.body?.username || 'unknown'
        });
        res.status(429).json({
            success: false,
            message: rateLimitConfig.auth.message,
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * Refresh token rate limiter
 * Applied to /refresh endpoint
 * Limits: 10 refresh attempts per 15 minutes
 * Prevents refresh token abuse
 */
const refreshLimiter = shouldSkipRateLimit ? passthroughLimiter : rateLimit({
    windowMs: rateLimitConfig.refresh.windowMs,
    max: rateLimitConfig.refresh.max,
    message: rateLimitConfig.refresh.message,
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        logSecurityEvent('REFRESH_RATE_LIMIT_EXCEEDED', req.ip, {
            endpoint: req.path
        });
        res.status(429).json({
            success: false,
            message: rateLimitConfig.refresh.message,
            retryAfter: req.rateLimit.resetTime
        });
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    refreshLimiter
};
