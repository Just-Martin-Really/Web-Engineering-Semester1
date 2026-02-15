const { logError } = require('../utils/errorLogger');
const { errorResponse } = require('../utils/responseHandler');
const {
    AppError,
    ValidationError,
    NotFoundError,
    ConflictError
} = require('../utils/errorClasses');

/**
 * Comprehensive error handler middleware
 * Converts all errors (custom and native) to standardized format
 * Distinguishes between operational errors (expected) and programming errors (bugs)
 * Logs errors appropriately and sends safe responses to clients
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next (required signature for error handler)
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
    let error = err;

    // Mongoose bad ObjectId error - convert to custom error
    if (err.name === 'CastError') {
        error = new NotFoundError('Ressource nicht gefunden', 'ObjectId');
    }

    // Mongoose duplicate key error - convert to custom error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = new ConflictError(`${field} bereits in Verwendung`, field);
    }

    // Mongoose validation error - convert to custom error
    // IMPORTANT: Don't treat our own ValidationError (express-validator) as a Mongoose ValidationError.
    if (err.name === 'ValidationError' && err.errors && typeof err.errors === 'object') {
        const details = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message
        }));
        error = new ValidationError('Validierungsfehler', details);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Ungültiger Token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token abgelaufen', 401);
    }

    // Default status code and message
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Interner Serverfehler';
    let errorCode = error.name || 'INTERNAL_ERROR';
    let details = null;

    // Include validation details if available
    if (error.details) {
        details = error.details;
    } else {
        details = [];
    }

    // Log the error with context
    logError(error, {
        requestId: req.id,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        ip: req.ip,
        statusCode
    });

    // Send error response
    const response = errorResponse(message, statusCode, errorCode, details);

    res.status(statusCode).json(response);
};

module.exports = { errorHandler };
