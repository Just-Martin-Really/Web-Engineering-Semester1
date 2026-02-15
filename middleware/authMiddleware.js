const { verifyAccessToken } = require('../utils/sessionUtils');
const { AuthenticationError } = require('../utils/errorClasses');
const { logAuthEvent, logSecurityEvent } = require('../utils/errorLogger');

/**
 * Authentication middleware
 * Verifies JWT access token from Authorization header
 * Extracts user information and adds to request object
 * Protects routes that require authentication
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Extract token from Authorization header
        // Expected format: "Bearer <token>"
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Token not provided
        if (!token) {
            logSecurityEvent('AUTH_NO_TOKEN', req.ip, {
                path: req.path,
                method: req.method
            });
            const error = new AuthenticationError('Authentifizierung erforderlich, Token nicht vorhanden');
            return next(error);
        }

        // Verify token and extract payload
        const decoded = verifyAccessToken(token);

        // Add user info to request for use in route handlers
        req.user = {
            id: decoded.id,
            username: decoded.username,
            sessionId: decoded.sessionId
        };

        logAuthEvent('TOKEN_VERIFIED', decoded.id, {
            sessionId: decoded.sessionId
        });

        next();
    } catch (error) {
        // Log security event for failed authentication
        logSecurityEvent('AUTH_FAILED', req.ip, {
            path: req.path,
            error: error.message
        });

        // Pass to error handler
        next(error);
    }
};

module.exports = { protect };
