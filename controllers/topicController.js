const Topic = require('../models/Topic');

/**
 * @desc    Get all topics
 * @route   GET /api/topics
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTopics = async (req, res, next) => {
    try {
        const topics = await Topic.find().sort({ createdAt: -1 });
        res.json(topics);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a topic
 * @route   POST /api/topics
 * @access  Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createTopic = async (req, res, next) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            res.status(400);
            throw new Error('Titel und Inhalt sind Pflichtfelder');
        }

        const topic = await Topic.create({
            title,
            content
        });

        res.status(201).json(topic);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTopics,
    createTopic
};
