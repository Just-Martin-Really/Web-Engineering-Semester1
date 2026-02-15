const Topic = require('../models/Topic');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { AuthorizationError } = require('../utils/errorClasses');
const { logAuthEvent } = require('../utils/errorLogger');

/**
 * @desc    Get all topics with optional filtering
 * @route   GET /api/topics
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTopics = async (req, res, next) => {
    try {
        const { kurs, page = 1, limit = 10 } = req.query;

        // Build query filter
        let query = {};
        if (kurs && ['TIA', 'TIS', 'TIK'].includes(kurs)) {
            query.kurs = kurs;
        }

        // Calculate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
        const skip = (pageNum - 1) * limitNum;

        // Fetch topics and total count
        const topics = await Topic.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(); // Use lean() for read-only performance

        const total = await Topic.countDocuments(query);

        // Return paginated response
        const response = paginatedResponse(
            topics,
            total,
            pageNum,
            limitNum,
            'Themen erfolgreich abgerufen'
        );

        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new topic
 * @route   POST /api/topics
 * @access  Private
 * @param {Object} req - Express request object (must be authenticated)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createTopic = async (req, res, next) => {
    try {
        const { title, content, kurs } = req.body;
        const userId = req.user.id;

        // Create topic document
        const topic = await Topic.create({
            title: title.trim(),
            content: content.trim(),
            kurs,
            author: userId // Link topic to user
        });

        if (!topic) {
            return next(new Error('Thema konnte nicht erstellt werden'));
        }

        // Log topic creation
        logAuthEvent('TOPIC_CREATED', userId, {
            topicId: topic._id,
            title: topic.title,
            kurs: topic.kurs
        });

        // Return success response
        const response = successResponse(
            topic,
            'Thema erfolgreich erstellt',
            201
        );

        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update an existing topic
 * @route   PUT /api/topics/:id
 * @access  Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateTopic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, kurs } = req.body;
        const userId = req.user.id;

        // Find topic
        const topic = await Topic.findById(id);
        if (!topic) {
            return next(new Error('Thema nicht gefunden'));
        }

        // Check authorization (only author can update)
        if (topic.author.toString() !== userId.toString()) {
            logAuthEvent('TOPIC_UPDATE_UNAUTHORIZED', userId, {
                topicId: id,
                authorId: topic.author
            });
            return next(new AuthorizationError('Sie können dieses Thema nicht bearbeiten'));
        }

        // Update fields
        topic.title = title.trim();
        topic.content = content.trim();
        topic.kurs = kurs;

        await topic.save();

        logAuthEvent('TOPIC_UPDATED', userId, {
            topicId: id,
            title: topic.title
        });

        const response = successResponse(
            topic,
            'Thema erfolgreich aktualisiert',
            200
        );

        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a topic
 * @route   DELETE /api/topics/:id
 * @access  Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteTopic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find and delete topic
        const topic = await Topic.findById(id);
        if (!topic) {
            return next(new Error('Thema nicht gefunden'));
        }

        // Check authorization
        if (topic.author.toString() !== userId.toString()) {
            logAuthEvent('TOPIC_DELETE_UNAUTHORIZED', userId, {
                topicId: id,
                authorId: topic.author
            });
            return next(new AuthorizationError('Sie können dieses Thema nicht löschen'));
        }

        await Topic.findByIdAndDelete(id);

        logAuthEvent('TOPIC_DELETED', userId, {
            topicId: id,
            title: topic.title
        });

        const response = successResponse(
            {},
            'Thema erfolgreich gelöscht',
            200
        );

        res.json(response);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic
};
