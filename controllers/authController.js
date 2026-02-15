const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');

/**
 * @desc    Register new user
 * @route   POST /api/registration
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const registerUser = async (req, res, next) => {
    try {
        const { firstname, lastname, username, password, course } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            res.status(400);
            throw new Error('Benutzername bereits vergeben');
        }

        const user = await User.create({
            firstname,
            lastname,
            username,
            password,
            course
        });

        if (user) {
            const token = generateToken(user);

            res.status(201).json({
                message: 'Registrierung erfolgreich',
                token,
                user: {
                    id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    username: user.username,
                    course: user.course
                }
            });
        } else {
            res.status(400);
            throw new Error('Ungültige Benutzerdaten');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Authenticate a user
 * @route   POST /api/login
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (user && (await user.comparePassword(password))) {
            const token = generateToken(user);

            res.json({
                message: 'Login erfolgreich',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    firstname: user.firstname,
                    lastname: user.lastname
                }
            });
        } else {
            res.status(401);
            throw new Error('Falsche Anmeldedaten');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser
};
