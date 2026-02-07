const mongoose = require('mongoose');

/**
 * Topic Schema
 * @typedef {Object} Topic
 * @property {string} title - Topic title
 * @property {string} content - Topic content
 * @property {Date} createdAt - Creation date
 */
const topicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Topic', topicSchema);
