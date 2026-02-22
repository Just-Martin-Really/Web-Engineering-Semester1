const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { accountLockoutConfig } = require('../utils/securityConfig');

/**
 * User Schema
 * Includes security features:
 * - Account lockout after failed login attempts
 * - Password hashing on save
 * - Audit timestamps
 * - Login attempt tracking
 *
 * @typedef {Object} User
 * @property {string} firstname - User's first name
 * @property {string} lastname - User's last name
 * @property {string} username - Unique username
 * @property {string} password - Hashed password
 * @property {string} course - User's course
 * @property {number} failedLoginAttempts - Tracks failed login attempts
 * @property {Date} lockoutUntil - When account lockout expires
 */
const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, 'Vorname ist erforderlich'],
        trim: true,
        minlength: [1, 'Vorname muss mindestens 1 Zeichen lang sein'],
        maxlength: [50, 'Vorname darf maximal 50 Zeichen lang sein']
    },
    lastname: {
        type: String,
        required: [true, 'Nachname ist erforderlich'],
        trim: true,
        minlength: [1, 'Nachname muss mindestens 1 Zeichen lang sein'],
        maxlength: [50, 'Nachname darf maximal 50 Zeichen lang sein']
    },
    username: {
        type: String,
        required: [true, 'Benutzername ist erforderlich'],
        unique: true,
        sparse: true,
        trim: true,
        minlength: [3, 'Benutzername muss mindestens 3 Zeichen lang sein'],
        maxlength: [20, 'Benutzername darf maximal 20 Zeichen lang sein'],
        lowercase: true,
        index: true // Index for faster lookups
    },
    password: {
        type: String,
        required: [true, 'Passwort ist erforderlich'],
        minlength: [8, 'Passwort muss mindestens 8 Zeichen lang sein'],
        select: false // Never return password in queries by default
    },
    course: {
        type: String,
        required: [true, 'Kurs ist erforderlich'],
        enum: {
            values: ['TIA', 'TIS', 'TIK'],
            message: 'Kurs muss TIA, TIS oder TIK sein'
        }
    },

    // Account lockout security fields
    failedLoginAttempts: {
        type: Number,
        default: 0,
        min: 0
    },
    lockoutUntil: {
        type: Date,
        default: null
    },
    lastFailedLoginAt: {
        type: Date,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

/**
 * Pre-save middleware to hash password
 * Only hashes if password is modified (not on every save)
 * Uses bcryptjs with salt rounds for security
 */
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);

        // Reset failed attempts when password is changed
        this.failedLoginAttempts = 0;
        this.lockoutUntil = null;
    } catch (err) {
        throw err;
    }
});

/**
 * Compares a candidate password with the hashed password
 * Used during login authentication
 *
 * @param {string} candidatePassword - The password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Checks if account is locked due to failed login attempts
 * @returns {boolean} True if account is currently locked
 */
userSchema.methods.isAccountLocked = function() {
    return this.lockoutUntil && this.lockoutUntil > new Date();
};

/**
 * Increments failed login attempt counter
 * Locks account after max failed attempts
 */
userSchema.methods.incrementFailedLoginAttempts = async function() {
    // Reset counter if last failed attempt was older than reset duration
    if (this.lastFailedLoginAt &&
        new Date() - this.lastFailedLoginAt > accountLockoutConfig.resetFailuresAfter) {
        this.failedLoginAttempts = 0;
    }

    this.failedLoginAttempts += 1;
    this.lastFailedLoginAt = new Date();

    // Lock account if max attempts exceeded
    if (this.failedLoginAttempts >= accountLockoutConfig.maxFailedAttempts) {
        this.lockoutUntil = new Date(Date.now() + accountLockoutConfig.lockoutDuration);
    }

    await this.save();
};

/**
 * Resets failed login attempts after successful authentication
 */
userSchema.methods.resetFailedLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.lockoutUntil = null;
    this.lastFailedLoginAt = null;
    this.lastLoginAt = new Date();
    await this.save();
};

module.exports = mongoose.model('User', userSchema);
