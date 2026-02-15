const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimitMiddleware');
const { asyncHandler } = require('../middleware/validationMiddleware');
const {
    registrationValidation,
    loginValidation,
    handleValidationErrors
} = require('../utils/validationRules');
const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
} = require('../controllers/authController');

/**
 * POST /api/registration
 * Register a new user
 * Rate limited to 5 attempts per 15 minutes
 * Input validation required
 */
router.post(
    '/registration',
    authLimiter, // Rate limit: 5 attempts per 15 min
    registrationValidation, // Validate all fields
    asyncHandler(handleValidationErrors), // Handle validation errors
    asyncHandler(registerUser)
);

/**
 * POST /api/login
 * Authenticate a user
 * Rate limited to 5 failed attempts per 15 minutes
 * Input validation required
 */
router.post(
    '/login',
    authLimiter,
    loginValidation,
    asyncHandler(handleValidationErrors),
    asyncHandler(loginUser)
);

/**
 * POST /api/refresh
 * Refresh access token using refresh token
 * Rate limited to 10 attempts per 15 minutes
 */
router.post(
    '/refresh',
    refreshLimiter,
    asyncHandler(refreshAccessToken)
);

/**
 * POST /api/logout
 * Logout user and invalidate session
 * Requires authentication
 */
router.post(
    '/logout',
    protect,
    asyncHandler(logoutUser)
);

module.exports = router;
