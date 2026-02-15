const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Generates a JWT token for a user.
 * 
 * @param {Object} user - The user object.
 * @param {string} user._id - The user's ID.
 * @param {string} user.username - The user's username.
 * @returns {string} The signed JWT token.
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
};

module.exports = {
    generateToken
};
