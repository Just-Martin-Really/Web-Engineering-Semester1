/**
 * Session Middleware
 * Initializes and manages express-session with MongoDB store
 * Handles session creation, persistence, and cleanup
 * Uses connect-mongo for storing sessions in MongoDB (persistent across server restarts)
 */

const session = require('express-session');
const MongoStore = require('connect-mongo');
const { sessionConfig } = require('../utils/securityConfig');

/**
 * Creates and returns configured session middleware
 * Requires MongoDB connection to be established before calling this
 *
 * @param {string} mongoUri - MongoDB connection URI
 * @returns {Function} Express session middleware
 */
const createSessionMiddleware = (mongoUri) => {
    return session({
        secret: sessionConfig.secret,
        resave: sessionConfig.resave,
        saveUninitialized: sessionConfig.saveUninitialized,

        // MongoDB store for persistent session storage
        store: new MongoStore({
            mongoUrl: mongoUri,
            touchAfter: sessionConfig.store.touchAfter,
            collectionName: 'sessions', // Custom collection name
            crypto: {
                secret: sessionConfig.secret // Encrypt sensitive session data
            }
        }),

        cookie: sessionConfig.cookie
    });
};

module.exports = { createSessionMiddleware };

