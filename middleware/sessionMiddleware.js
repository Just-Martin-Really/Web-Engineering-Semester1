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
 *
 * Contract:
 * - Input: { mongoUri?: string, mongoClient?: import('mongodb').MongoClient }
 * - Output: Express middleware function
 * - Error modes: throws if neither mongoUri nor mongoClient is provided
 */
const createSessionMiddleware = ({ mongoUri, mongoClient }) => {
    if (!mongoUri && !mongoClient) {
        throw new Error('createSessionMiddleware requires mongoUri or mongoClient');
    }

    const storeOptions = {
        touchAfter: sessionConfig.store.touchAfter,
        collectionName: 'sessions'
    };

    // connect-mongo crypto is optional; only enable if secret is present.
    if (sessionConfig.secret && typeof sessionConfig.secret === 'string' && sessionConfig.secret.trim().length > 0) {
        storeOptions.crypto = { secret: sessionConfig.secret };
    }

    // Prefer reusing an existing MongoClient (mongoose connection) to avoid extra connections.
    const store = mongoClient
        ? MongoStore.create({ client: mongoClient, ...storeOptions })
        : MongoStore.create({ mongoUrl: mongoUri, ...storeOptions });

    return session({
        name: 'sid',
        secret: sessionConfig.secret,
        resave: sessionConfig.resave,
        saveUninitialized: sessionConfig.saveUninitialized,
        store,
        cookie: sessionConfig.cookie,
        proxy: true
    });
};

module.exports = { createSessionMiddleware };

