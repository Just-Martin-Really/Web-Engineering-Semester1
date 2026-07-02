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
 */
const registerUser = async (req, res, next) => {
    try {
        const {firstname, lastname, username, password, course} = req.body;

        const userExists = await User.findOne({username: username.toLowerCase()});
        if (userExists) {
            logSecurityEvent('REGISTRATION_DUPLICATE_USERNAME', req.ip, {
                username,
                userId: userExists.id
            });
            return next(new ConflictError('Benutzername bereits vergeben', 'username'));
        }

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

        const tokenPair = generateTokenPair(user, req);

        logAuthEvent('USER_REGISTERED', user.id, {
            username: user.username,
            course: user.course
        });

        const response = successResponse(
            {
                user: {
                    id: user.id,
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
 */
const loginUser = async (req, res, next) => {
    try {
        const {username, password} = req.body;

        const user = await User.findOne({username: username.toLowerCase()}, {includePassword: true});

        if (!user) {
            logSecurityEvent('LOGIN_USER_NOT_FOUND', req.ip, {
                username,
                attemptedUsername: username
            });
            return next(new AuthenticationError('Benutzername oder Passwort ungültig'));
        }

        if (user.isAccountLocked()) {
            logSecurityEvent('LOGIN_ACCOUNT_LOCKED', req.ip, {
                userId: user.id,
                username: user.username,
                lockedUntil: user.lockoutUntil
            });
            return next(new AuthenticationError('Konto ist gesperrt, bitte später versuchen'));
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            await user.incrementFailedLoginAttempts();

            logSecurityEvent('LOGIN_FAILED_INVALID_PASSWORD', req.ip, {
                userId: user.id,
                username: user.username,
                failedAttempts: user.failedLoginAttempts
            });

            return next(new AuthenticationError('Benutzername oder Passwort ungültig'));
        }

        await user.resetFailedLoginAttempts();

        const tokenPair = generateTokenPair(user, req);

        if (req.session) {
            req.session.userId = user.id.toString();
            req.session.username = user.username;
            req.session.sessionId = tokenPair.sessionId;
        }

        logAuthEvent('USER_LOGIN', user.id, {
            username: user.username,
            sessionId: tokenPair.sessionId
        });

        const response = successResponse(
            {
                user: {
                    id: user.id,
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
 */
const refreshAccessToken = async (req, res, next) => {
    try {
        const {refreshToken} = req.body;

        if (!refreshToken) {
            return next(new AuthenticationError('Refresh token erforderlich'));
        }

        const {verifyRefreshToken} = require('../utils/sessionUtils');
        const decoded = verifyRefreshToken(refreshToken);

        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AuthenticationError('Benutzer nicht gefunden'));
        }

        const {generateAccessToken} = require('../utils/sessionUtils');
        const newAccessToken = generateAccessToken(user, decoded.sessionId);

        logAuthEvent('TOKEN_REFRESHED', user.id, {
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
 */
const logoutUser = async (req, res, next) => {
    try {
        logAuthEvent('USER_LOGOUT', req.user.id, {
            sessionId: req.user.sessionId
        });

        if (req.session) {
            req.session.destroy(() => {});
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
