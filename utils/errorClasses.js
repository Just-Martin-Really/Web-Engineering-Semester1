/**
 * Custom Error Classes for Consistent Error Handling
 * These classes extend Error and provide structured error responses
 * This follows the DRY principle by centralizing error definitions
 */

/**
 * Base AppError class - all custom errors inherit from this
 * Ensures consistent error structure across the application
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * ValidationError - Thrown when input validation fails
 * Used for invalid request bodies, missing required fields, etc.
 */
class ValidationError extends AppError {
    constructor(message = 'Validierungsfehler', details = []) {
        super(message, 400);
        this.name = 'ValidationError';
        this.details = details;
    }
}

/**
 * AuthenticationError - Thrown when user authentication fails
 * Used for invalid credentials, missing tokens, expired tokens
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentifizierung erforderlich') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

/**
 * AuthorizationError - Thrown when user lacks required permissions
 * Used for accessing resources they don't own, insufficient role, etc.
 */
class AuthorizationError extends AppError {
    constructor(message = 'Zugriff verweigert') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

/**
 * NotFoundError - Thrown when a requested resource doesn't exist
 * Used for missing users, topics, sessions, etc.
 */
class NotFoundError extends AppError {
    constructor(message = 'Ressource nicht gefunden', resourceType = '') {
        super(message, 404);
        this.name = 'NotFoundError';
        this.resourceType = resourceType;
    }
}

/**
 * ConflictError - Thrown when a resource already exists
 * Used for duplicate usernames, duplicate topics, etc.
 */
class ConflictError extends AppError {
    constructor(message = 'Ressource existiert bereits', field = '') {
        super(message, 409);
        this.name = 'ConflictError';
        this.field = field;
    }
}

/**
 * TooManyRequestsError - Thrown when rate limit is exceeded
 * Used to enforce API rate limiting
 */
class TooManyRequestsError extends AppError {
    constructor(message = 'Zu viele Anfragen, bitte später versuchen') {
        super(message, 429);
        this.name = 'TooManyRequestsError';
    }
}

/**
 * InternalServerError - Generic server error (rare, mostly for db issues)
 * Should be logged but not expose details to client
 */
class InternalServerError extends AppError {
    constructor(message = 'Interner Serverfehler', originalError = null) {
        super(message, 500);
        this.name = 'InternalServerError';
        this.originalError = originalError;
    }
}

/**
 * SessionError - Thrown when session operations fail
 * Used for session expiry, session not found, etc.
 */
class SessionError extends AppError {
    constructor(message = 'Sitzungsfehler') {
        super(message, 401);
        this.name = 'SessionError';
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    TooManyRequestsError,
    InternalServerError,
    SessionError
};

