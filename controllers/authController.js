const User = require('../models/User');
const {generateTokenPair} = require('../utils/tokenUtils');
const {successResponse} = require('../utils/responseHandler');
const {
    ConflictError,
    AuthenticationError,
    InternalServerError
} = require('../utils/errorClasses');
const {logAuthEvent, logSecurityEvent} = require('../utils/errorLogger');

/**
 * @desc    Register new user
 * @route   POST /api/registration
 * @access  Public
 * @param {Object} req - Express request object (with validated body)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const registerUser = async (req, res, next) => {
    try {
        const {firstname, lastname, username, password, course} = req.body;

        // Check if user already exists
        const userExists = await User.findOne({username: username.toLowerCase()});
        if (userExists) {
            logSecurityEvent('REGISTRATION_DUPLICATE_USERNAME', req.ip, {
                username,
                userId: userExists._id
            });
            return next(new ConflictError('Benutzername bereits vergeben', 'username'));
        }

        // Create new user
        const user = await User.create({
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            username: username.toLowerCase().trim(),
            password,
            course
        });

        if (!user) {
            return next(new InternalServerError('Benutzer konnte nicht erstellt werden'));
        }

        // Generate tokens
        const tokenPair = generateTokenPair(user, req);

        // Log successful registration
        logAuthEvent('USER_REGISTERED', user._id, {
            username: user.username,
            course: user.course
        });

        // Return successful response with tokens and user info
        const response = successResponse(
            {
                user: {
                    id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    username: user.username,
                    course: user.course
                },
                accessToken: tokenPair.accessToken,
                refreshToken: tokenPair.refreshToken,
                sessionId: tokenPair.sessionId,
                expiresIn: tokenPair.expiresIn
            },
            'Registrierung erfolgreich',
            201
        );

        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Authenticate a user
 * @route   POST /api/login
 * @access  Public
 * @param {Object} req - Express request object (with validated body)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const loginUser = async (req, res, next) => {
    try {
        const {username, password} = req.body;

        // Find user by username
        const user = await User.findOne({username: username.toLowerCase()}).select('+password');

        if (!user) {
            logSecurityEvent('LOGIN_USER_NOT_FOUND', req.ip, {
                username,
                attemptedUsername: username
            });
            return next(new AuthenticationError('Benutzername oder Passwort ungültig'));
        }

        // Check if account is locked due to failed attempts
        if (user.isAccountLocked()) {
            logSecurityEvent('LOGIN_ACCOUNT_LOCKED', req.ip, {
                userId: user._id,
                username: user.username,
                lockedUntil: user.lockoutUntil
            });
            return next(new AuthenticationError('Konto ist gesperrt, bitte später versuchen'));
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            // Increment failed attempts
            await user.incrementFailedLoginAttempts();

            logSecurityEvent('LOGIN_FAILED_INVALID_PASSWORD', req.ip, {
                userId: user._id,
                username: user.username,
                failedAttempts: user.failedLoginAttempts
            });

            return next(new AuthenticationError('Benutzername oder Passwort ungültig'));
        }

        // Password is correct - reset failed login attempts
        await user.resetFailedLoginAttempts();

        // Generate token pair
        const tokenPair = generateTokenPair(user, req);

        // Persist server-side session (MongoStore) for local app state.
        // This is what causes a session document to be created and Set-Cookie to be returned.
        if (req.session) {
            req.session.userId = user._id.toString();
            req.session.username = user.username;
            req.session.sessionId = tokenPair.sessionId;
        }

        // Log successful login
        logAuthEvent('USER_LOGIN', user._id, {
            username: user.username,
            sessionId: tokenPair.sessionId
        });

        // Return successful response
        const response = successResponse(
            {
                user: {
                    id: user._id,
                    username: user.username,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    course: user.course
                },
                accessToken: tokenPair.accessToken,
                refreshToken: tokenPair.refreshToken,
                sessionId: tokenPair.sessionId,
                expiresIn: tokenPair.expiresIn
            },
            'Login erfolgreich',
            200
        );

        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/refresh
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const refreshAccessToken = async (req, res, next) => {
    try {
        const {refreshToken} = req.body;

        if (!refreshToken) {
            return next(new AuthenticationError('Refresh token erforderlich'));
        }

        // Verify refresh token and get user info
        const {verifyRefreshToken} = require('../utils/sessionUtils');
        const decoded = verifyRefreshToken(refreshToken);

        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AuthenticationError('Benutzer nicht gefunden'));
        }

        // Generate new access token (keep same session ID)
        const {generateAccessToken} = require('../utils/sessionUtils');
        const newAccessToken = generateAccessToken(user, decoded.sessionId);

        logAuthEvent('TOKEN_REFRESHED', user._id, {
            sessionId: decoded.sessionId
        });

        const response = successResponse(
            {
                accessToken: newAccessToken,
                expiresIn: '15m'
            },
            'Token aktualisiert',
            200
        );

        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout user (invalidate session)
 * @route   POST /api/logout
 * @access  Private
 * @param {Object} req - Express request object (must be authenticated)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logoutUser = async (req, res, next) => {
    try {
        logAuthEvent('USER_LOGOUT', req.user.id, {
            sessionId: req.user.sessionId
        });

        // Destroy server-side session if present
        if (req.session) {
            req.session.destroy(() => {
                // Intentionally ignore destroy errors here; logout should still succeed.
            });
        }

        const response = successResponse(
            {},
            'Logout erfolgreich',
            200
        );

        res.json(response);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
};
