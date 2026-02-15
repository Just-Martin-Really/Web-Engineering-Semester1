/**
 * Validation Middleware Wrapper
 * Wraps express-validator to handle validation in routes
 * Provides reusable validation chain middleware
 */

const { handleValidationErrors } = require('../utils/validationRules');

/**
 * Wrapper for async route handlers with built-in error handling
 * Catches validation errors and passes them to error middleware
 * Prevents unhandled promise rejections
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped handler with error catching
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    handleValidationErrors,
    asyncHandler
};

