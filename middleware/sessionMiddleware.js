const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('../db');
const {sessionConfig} = require('../utils/securityConfig');

const createSessionMiddleware = () => {
    return session({
        name: 'sid',
        secret: sessionConfig.secret,
        resave: sessionConfig.resave,
        saveUninitialized: sessionConfig.saveUninitialized,
        store: new pgSession({
            pool,
            tableName: 'session',
            pruneSessionInterval: 60 * 15
        }),
        cookie: sessionConfig.cookie,
        proxy: true
    });
};

module.exports = {createSessionMiddleware};
