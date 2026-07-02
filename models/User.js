const bcrypt = require('bcryptjs');
const pool = require('../db');
const { accountLockoutConfig } = require('../utils/securityConfig');

const BASE_COLS = 'id, firstname, lastname, username, course, failed_login_attempts, lockout_until, last_failed_login_at, last_login_at, created_at, updated_at';
const WITH_PASSWORD = BASE_COLS + ', password';

class UserInstance {
    constructor(row) {
        this.id = row.id;
        this.firstname = row.firstname;
        this.lastname = row.lastname;
        this.username = row.username;
        this.password = row.password;
        this.course = row.course;
        this.failedLoginAttempts = row.failed_login_attempts;
        this.lockoutUntil = row.lockout_until;
        this.lastFailedLoginAt = row.last_failed_login_at;
        this.lastLoginAt = row.last_login_at;
        this.createdAt = row.created_at;
        this.updatedAt = row.updated_at;
    }

    async comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    }

    isAccountLocked() {
        return this.lockoutUntil && this.lockoutUntil > new Date();
    }

    async incrementFailedLoginAttempts() {
        if (this.lastFailedLoginAt &&
            new Date() - this.lastFailedLoginAt > accountLockoutConfig.resetFailuresAfter) {
            this.failedLoginAttempts = 0;
        }

        this.failedLoginAttempts += 1;
        this.lastFailedLoginAt = new Date();

        if (this.failedLoginAttempts >= accountLockoutConfig.maxFailedAttempts) {
            this.lockoutUntil = new Date(Date.now() + accountLockoutConfig.lockoutDuration);
        }

        await pool.query(
            `UPDATE users SET failed_login_attempts = $1, last_failed_login_at = $2, lockout_until = $3, updated_at = NOW() WHERE id = $4`,
            [this.failedLoginAttempts, this.lastFailedLoginAt, this.lockoutUntil, this.id]
        );
    }

    async resetFailedLoginAttempts() {
        this.failedLoginAttempts = 0;
        this.lockoutUntil = null;
        this.lastFailedLoginAt = null;
        this.lastLoginAt = new Date();

        await pool.query(
            `UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_failed_login_at = NULL, last_login_at = $1, updated_at = NOW() WHERE id = $2`,
            [this.lastLoginAt, this.id]
        );
    }
}

const User = {
    async findOne({ username }, { includePassword = false } = {}) {
        const cols = includePassword ? WITH_PASSWORD : BASE_COLS;
        const { rows } = await pool.query(
            `SELECT ${cols} FROM users WHERE username = $1`,
            [username]
        );
        return rows[0] ? new UserInstance(rows[0]) : null;
    },

    async findById(id) {
        const { rows } = await pool.query(
            `SELECT ${BASE_COLS} FROM users WHERE id = $1`,
            [id]
        );
        return rows[0] ? new UserInstance(rows[0]) : null;
    },

    async create({ firstname, lastname, username, password, course }) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const { rows } = await pool.query(
            `INSERT INTO users (firstname, lastname, username, password, course)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING ${BASE_COLS}`,
            [firstname, lastname, username, hashed, course]
        );
        return new UserInstance(rows[0]);
    }
};

module.exports = User;
