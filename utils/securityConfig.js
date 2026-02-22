/**
 * Security Configuration and Utilities
 * Centralizes all security-related configuration
 * Follows DRY principle - single source of truth for security settings
 */

/**
 * Rate limiting configurations for different endpoints
 * Prevents brute force attacks and DOS
 */
const rateLimitConfig = {
    // General API rate limiting
    general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: 'Zu viele Anfragen von dieser IP, bitte später versuchen'
    },

    // Authentication endpoints (stricter)
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window (prevents brute force)
        skipSuccessfulRequests: true, // Only count failed attempts
        message: 'Zu viele Anmeldeversuche, bitte später versuchen'
    },

    // Token refresh endpoint (moderate)
    refresh: {
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: 'Zu viele Token-Refresh-Anfragen'
    }
};

/**
 * Session configuration
 * Controls how sessions behave and are stored
 */
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false, // Don't save unchanged sessions
    saveUninitialized: false, // Don't create session until modified

    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Cannot be accessed by client-side JS (XSS protection)
        sameSite: 'strict', // CSRF protection - strict same-site cookie policy
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },

    store: {
        // Configured in sessionMiddleware
        // Uses MongoDB for persistent session storage
        touchAfter: 24 * 3600 // Lazy session update (every 24h)
    }
};

/**
 * CORS configuration for production
 * Restricts cross-origin requests to trusted origins
 */
const corsConfig = {
    development: {
        origin: true, // Allow all origins in development
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    production: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://futuredomain.com'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400 // Cache preflight response for 24 hours
    }
};

/**
 * Helmet configuration for HTTP security headers
 * Protects against various attacks (clickjacking, XSS, etc.)
 */
const isProduction = process.env.NODE_ENV === 'production';

const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust based on needs
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],

            upgradeInsecureRequests: isProduction ? [] : null
        }
    },
    frameguard: {
        action: 'deny' // Prevent clickjacking
    },
    noSniff: true, // Prevent MIME type sniffing
    xssFilter: true, // Enable XSS filter
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin' // Control referrer information
    },

    hsts: isProduction
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        }
        : false
};

/**
 * Password requirements for validation
 * Enforced in registration validation
 */
const passwordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false // Can be enabled for higher security
};

/**
 * Account lockout configuration
 * Prevents brute force password attacks
 */
const accountLockoutConfig = {
    maxFailedAttempts: 5, // Lock after 5 failed attempts
    lockoutDuration: 15 * 60 * 1000, // Lock for 15 minutes
    resetFailuresAfter: 1 * 60 * 60 * 1000 // Reset counter after 1 hour
};

module.exports = {
    rateLimitConfig,
    sessionConfig,
    corsConfig,
    helmetConfig,
    passwordRequirements,
    accountLockoutConfig
};
