const Topic = require('../models/Topic');
const {successResponse, paginatedResponse} = require('../utils/responseHandler');
const {AuthorizationError} = require('../utils/errorClasses');
const {logAuthEvent} = require('../utils/errorLogger');

/**
 * @desc    Get all topics with optional filtering
 * @route   GET /api/topics
 * @access  Public
 */
const getTopics = async (req, res, next) => {
    try {
        const {kurs, page = 1, limit = 10} = req.query;

        const filter = {};
        if (kurs && ['TIA', 'TIS', 'TIK'].includes(kurs)) {
            filter.kurs = kurs;
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const topics = await Topic.find(filter, {skip, limit: limitNum});

        const normalizedTopics = topics.map(t => {
            const authorName = t?.author?.username || t?.seedAuthorName || 'Unbekannt';
            return {...t, authorName};
        });

        const total = await Topic.count(filter);

        const response = paginatedResponse(
            normalizedTopics,
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
 */
const createTopic = async (req, res, next) => {
    try {
        const {title, content, kurs} = req.body;
        const userId = req.user.id;

        const topic = await Topic.create({
            title: title.trim(),
            content: content.trim(),
            kurs,
            authorId: userId
        });

        if (!topic) {
            return next(new Error('Thema konnte nicht erstellt werden'));
        }

        logAuthEvent('TOPIC_CREATED', userId, {
            topicId: topic.id,
            title: topic.title,
            kurs: topic.kurs
        });

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
 * @desc    Delete a topic
 * @route   DELETE /api/topics/:id
 * @access  Private
 */
const deleteTopic = async (req, res, next) => {
    try {
        const {id} = req.params;
        const userId = req.user.id;

        const topic = await Topic.findById(id);
        if (!topic) {
            return next(new Error('Thema nicht gefunden'));
        }

        if (String(topic.authorId) !== String(userId)) {
            logAuthEvent('TOPIC_DELETE_UNAUTHORIZED', userId, {
                topicId: id,
                authorId: topic.authorId
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

/**
 * @desc    Add a comment to a topic
 * @route   POST /api/topics/:id/comments
 * @access  Private
 */
const addComment = async (req, res, next) => {
    try {
        const {id} = req.params;
        const userId = req.user.id;
        const {content} = req.body;

        const topic = await Topic.findById(id);
        if (!topic) {
            return next(new Error('Thema nicht gefunden'));
        }

        await topic.pushComment({content: content.trim(), authorId: userId});
        await topic.populateCommentAuthors();

        const response = successResponse(
            topic,
            'Kommentar erfolgreich erstellt',
            201
        );

        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTopics,
    createTopic,
    deleteTopic,
    addComment
};
