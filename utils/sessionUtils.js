/**
 * Session Utilities
 * Handles session creation, validation, and management
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { SessionError, AuthenticationError } = require('./errorClasses');
const { logAuthEvent } = require('./errorLogger');

// Environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m'; // Short-lived for security
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d'; // Longer-lived for convenience

/**
 * Generates an access token (short-lived, used for API requests)
 * @param {Object} user - User document from database
 * @param {string} sessionId - Unique session identifier
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (user, sessionId) => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            sessionId, // Links token to specific session
            type: 'access'
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

/**
 * Generates a refresh token (long-lived, used to get new access tokens)
 * For now saved in localStorage, will be stored in HTTP-Cookies in prod
 * @param {Object} user - User document from database
 * @param {string} sessionId - Unique session identifier
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (user, sessionId) => {
    return jwt.sign(
        {
            id: user._id,
            sessionId,
            type: 'refresh'
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

/**
 * Generates metadata (sessionId, ip, userAgent). Not wired into request flow.
 * Used to detect suspicious sessions and enforce security
 * currently not really used, will be stored in HTTP-Cookies in prod
 * @param {Object} req - Express request object
 * @returns {Object} Session metadata
 */
const generateSessionMetadata = (req) => {
    return {
        sessionId: uuidv4(),
        createdAt: new Date(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'Unknown',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
};

/**
 * Verifies an access token and extracts user info
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        if (decoded.type !== 'access') {
            throw new AuthenticationError('Token-Typ ungültig');
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AuthenticationError('Zugriffstoken abgelaufen');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AuthenticationError('Token ungültig');
        }
        throw error;
    }
};

/**
 * Verifies a refresh token and extracts session info
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
        if (decoded.type !== 'refresh') {
            throw new AuthenticationError('Token-Typ ungültig');
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new SessionError('Sitzung abgelaufen, bitte melden Sie sich erneut an');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AuthenticationError('Token ungültig');
        }
        throw error;
    }
};

/**
 * Validates session metadata for security
 * Could check if session matches expected IP/User-Agent to prevent session hijacking
 * Currently not used, will be stored in HTTP-Cookies in prod
 * @param {Object} sessionData - Session data from store
 * @param {Object} req - Express request object
 * @returns {boolean} True if session is valid, throws error otherwise
 */
const validateSessionSecurity = (sessionData, req) => {
    if (!sessionData) {
        throw new SessionError('Sitzung nicht gefunden');
    }

    const currentIp = req.ip || req.connection.remoteAddress;
    const currentUserAgent = req.get('user-agent');

    // Check if IP changed (potential session hijacking)
    if (sessionData.ip !== currentIp) {
        logAuthEvent('SESSION_IP_MISMATCH', sessionData.userId, {
            expectedIp: sessionData.ip,
            actualIp: currentIp,
            suspiciousActivity: true
        });
        throw new SessionError('Verdächtige Aktivität erkannt, bitte melden Sie sich erneut an');
    }

    // Check if User-Agent changed (potential session hijacking)
    if (sessionData.userAgent !== currentUserAgent) {
        logAuthEvent('SESSION_USER_AGENT_CHANGE', sessionData.userId, {
            expectedUserAgent: sessionData.userAgent,
            actualUserAgent: currentUserAgent,
            warning: true // Less strict than IP, but logged
        });
    }

    // Check if session has expired
    if (new Date() > new Date(sessionData.expiresAt)) {
        throw new SessionError('Sitzung abgelaufen');
    }

    return true;
};

/**
 * Updates session last activity timestamp
 * Used to extend session expiry for active users
 * @param {Object} sessionData - Session data to update
 * @returns {Object} Updated session data
 */
const updateSessionActivity = (sessionData) => {
    sessionData.lastActivityAt = new Date();
    // Optionally extend expiry if session is still active
    if (Date.now() < new Date(sessionData.expiresAt).getTime()) {
        sessionData.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    return sessionData;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateSessionMetadata,
    verifyAccessToken,
    verifyRefreshToken,
    validateSessionSecurity,
    updateSessionActivity,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY
};

