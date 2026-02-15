/**
 * Response Handler Utility
 * Provides standardized response formatting across the entire API
 * Follows DRY principle - single source of truth for response structure
 * Ensures consistent error and success response format for clients
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Standardized success response format
 * @param {Object} data - The response data
 * @param {string} message - User-friendly message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted response object
 */
const successResponse = (data, message = 'Erfolg', statusCode = 200) => {
    return {
        success: true,
        statusCode,
        message,
        data,
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
    };
};

/**
 * Standardized error response format
 * Includes unique error ID for client debugging and server-side tracing
 * @param {string} message - Error message shown to client
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Machine-readable error code
 * @param {Object} details - Additional error details (only in dev mode)
 * @returns {Object} Formatted error response object
 */
const errorResponse = (message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) => {
    const response = {
        success: false,
        statusCode,
        message,
        errorCode,
        errorId: uuidv4(), // Unique ID to trace in logs
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
    };

    // Include details only in development mode for security
    if (process.env.NODE_ENV === 'development' && details) {
        response.details = details;
    }

    return response;
};

/**
 * Paginated response format for list endpoints
 * Useful for topics, users, etc. that might have many results
 * @param {Array} data - Array of items
 * @param {number} total - Total count of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {string} message - Response message
 * @returns {Object} Formatted paginated response
 */
const paginatedResponse = (data, total, page = 1, limit = 10, message = 'Erfolg') => {
    const totalPages = Math.ceil(total / limit);

    return {
        success: true,
        statusCode: 200,
        message,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        },
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
    };
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse
};

