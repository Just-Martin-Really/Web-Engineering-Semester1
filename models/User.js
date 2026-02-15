const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * @typedef {Object} User
 * @property {string} firstname - User's first name
 * @property {string} lastname - User's last name
 * @property {string} username - Unique username (email)
 * @property {string} password - Hashed password
 * @property {string} course - User's course
 */
const userSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    course: { type: String, required: true },
}, { timestamps: true });

/**
 * Pre-save middleware to hash password.
 */
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

/**
 * Compares a candidate password with the hashed password in the database.
 * 
 * @param {string} candidatePassword - The password to compare
 * @returns {Promise<boolean>} Match result
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
