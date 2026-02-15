const {
    generateAccessToken,
    generateRefreshToken,
    generateSessionMetadata,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY
} = require('./sessionUtils');

/**
 * Creates a complete token pair with session metadata
 * Returns both access token (short-lived) and refresh token (long-lived)
 * Also generates session metadata for tracking
 *
 * @param {Object} user - User document from database
 * @param {Object} req - Express request (for session metadata)
 * @returns {Object} Token pair and session info
 */
const generateTokenPair = (user, req) => {
    const sessionMetadata = generateSessionMetadata(req);
    const accessToken = generateAccessToken(user, sessionMetadata.sessionId);
    const refreshToken = generateRefreshToken(user, sessionMetadata.sessionId);

    return {
        accessToken,
        refreshToken,
        sessionId: sessionMetadata.sessionId,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        refreshExpiresIn: REFRESH_TOKEN_EXPIRY,
        sessionMetadata
    };
};

/**
 * Legacy token generation for backward compatibility
 * Can be gradually deprecated in favor of generateTokenPair
 *
 * @param {Object} user - User document
 * @returns {string} JWT access token
 */
const generateToken = (user) => {
    // Use empty session ID for legacy compatibility
    return generateAccessToken(user, 'legacy');
};

module.exports = {
    generateTokenPair,
    generateToken,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY
};
