/**
 * Validation Rules for Input Validation
 * Centralizes all validation schemas for DRY principle
 * Uses express-validator for consistent validation across routes
 * Reusable validation chains for registration, login, and topic creation
 */

const { body, validationResult } = require('express-validator');
const { ValidationError } = require('./errorClasses');

/**
 * Username validation rules
 * - Must be 3-20 characters
 * - Can contain letters, numbers, underscores, hyphens
 * - Cannot have leading/trailing spaces
 */
const usernameValidation = body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Benutzername muss zwischen 3 und 20 Zeichen lang sein')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten');

/**
 * Password validation rules
 * - Minimum 8 characters
 * - Must contain uppercase, lowercase, number
 * - Can contain special characters
 */
const passwordValidation = body('password')
    .isLength({ min: 8 })
    .withMessage('Passwort muss mindestens 8 Zeichen lang sein')
    .matches(/[A-Z]/)
    .withMessage('Passwort muss mindestens einen Großbuchstaben enthalten')
    .matches(/[a-z]/)
    .withMessage('Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .matches(/[0-9]/)
    .withMessage('Passwort muss mindestens eine Zahl enthalten');

/**
 * First name validation rules
 * - 1-50 characters
 * - Letters only (allows international characters)
 */
const firstNameValidation = body('firstname')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Vorname muss zwischen 1 und 50 Zeichen lang sein')
    .matches(/^[a-zA-ZäöüßÄÖÜ\s'-]+$/)
    .withMessage('Vorname darf nur Buchstaben, Leerzeichen, Apostrophe und Bindestriche enthalten');

/**
 * Last name validation rules
 * - 1-50 characters
 * - Letters only (allows international characters)
 */
const lastNameValidation = body('lastname')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nachname muss zwischen 1 und 50 Zeichen lang sein')
    .matches(/^[a-zA-ZäöüßÄÖÜ\s'-]+$/)
    .withMessage('Nachname darf nur Buchstaben, Leerzeichen, Apostrophe und Bindestriche enthalten');

/**
 * Course validation rules
 * - Must be one of: TIA, TIS, TIK
 */
const courseValidation = body('course')
    .isIn(['TIA', 'TIS', 'TIK'])
    .withMessage('Kurs muss TIA, TIS oder TIK sein');

/**
 * Topic title validation rules
 * - 5-100 characters
 * - No leading/trailing spaces
 */
const topicTitleValidation = body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Titel muss zwischen 5 und 100 Zeichen lang sein');

/**
 * Topic content validation rules
 * - Minimum 10 characters (meaningful content)
 * - Maximum 10000 characters
 */
const topicContentValidation = body('content')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Inhalt muss zwischen 10 und 10000 Zeichen lang sein');

/**
 * Comment content validation rules
 * - 1-1000 characters
 */
const commentContentValidation = body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Kommentar muss zwischen 1 und 1000 Zeichen lang sein');

/**
 * Middleware to handle validation errors
 * Extracts validation errors and throws ValidationError
 * This is called after validation middleware to check for errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const details = errors.array().map(err => ({
            field: err.path ?? err.param,
            message: err.msg,
            value: err.value
        }));
        throw new ValidationError('Validierungsfehler', details);
    }
    next();
};

/**
 * Composable validation chains for registration
 * Groups all user registration validation rules
 */
const registrationValidation = [
    firstNameValidation,
    lastNameValidation,
    usernameValidation,
    passwordValidation,
    courseValidation
];

/**
 * Composable validation chains for login
 * Groups all login validation rules
 */
const loginValidation = [
    usernameValidation,
    body('password').notEmpty().withMessage('Passwort ist erforderlich')
];

/**
 * Composable validation chains for topic creation
 * Groups all topic validation rules
 */
const topicValidation = [
    topicTitleValidation,
    topicContentValidation,
    body('kurs')
        .isIn(['TIA', 'TIS', 'TIK'])
        .withMessage('Kurs muss TIA, TIS oder TIK sein')
];

/**
 * Composable validation chains for adding a comment
 */
const commentValidation = [
    commentContentValidation
];

module.exports = {
    // Individual validators
    usernameValidation,
    passwordValidation,
    firstNameValidation,
    lastNameValidation,
    courseValidation,
    topicTitleValidation,
    topicContentValidation,
    commentContentValidation,

    // Handlers
    handleValidationErrors,

    // Composable chains
    registrationValidation,
    loginValidation,
    topicValidation,
    commentValidation
};
