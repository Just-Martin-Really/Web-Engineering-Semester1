const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Add user info to request (you might want to fetch full user from DB if needed)
            req.user = decoded;

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Nicht autorisiert, Token ungültig' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Nicht autorisiert, kein Token vorhanden' });
    }
};

module.exports = { protect, JWT_SECRET };
