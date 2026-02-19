const mongoose = require('mongoose');

/**
 * Topic Schema
 * @typedef {Object} Topic
 * @property {string} title - Topic title
 * @property {string} content - Topic content
 * @property {string} kurs - Course category
 * @property {Date} createdAt - Creation date
 * @property {mongoose.Types.ObjectId} author - User reference
 * @property {Array} comments - Embedded comments
 */
const topicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    kurs: { type: String, required: true, enum: ['TIA', 'TIS', 'TIK'] },

    // Optional marker for demo/seed data (idempotent upserts)
    seedKey: {
        type: String,
        unique: true,
        sparse: true
    },

    // Optional display-only author for seeded/demo topics (does not require a User)
    seedAuthorName: {
        type: String,
        trim: true,
        maxlength: 50
    },

    // Author of the topic (set on creation)
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Embedded comments (MVP)
    comments: {
        type: [
            {
                content: { type: String, required: true, trim: true },
                author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
                // Optional display-only author for seeded/demo comments
                seedAuthorName: { type: String, trim: true, maxlength: 50 },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        default: []
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Topic', topicSchema);
