const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const {generalLimiter} = require('../middleware/rateLimitMiddleware');
const {asyncHandler} = require('../middleware/validationMiddleware');
const {
    topicValidation,
    handleValidationErrors,
    commentValidation
} = require('../utils/validationRules');
const {
    getTopics,
    createTopic,
    deleteTopic,
    addComment
} = require('../controllers/topicController');

/**
 * GET /api/topics
 * Get all topics with optional filtering and pagination
 * Public access
 */
router.get('/', generalLimiter, asyncHandler(getTopics));

/**
 * POST /api/topics
 * Create a new topic
 * Requires authentication
 * Input validation required
 */
router.post(
    '/',
    protect,
    generalLimiter,
    topicValidation,
    asyncHandler(handleValidationErrors),
    asyncHandler(createTopic)
);

/**
 * DELETE /api/topics/:id
 * Delete a topic
 * Requires authentication (only author can delete)
 */
router.delete(
    '/:id',
    protect,
    generalLimiter,
    asyncHandler(deleteTopic)
);

/**
 * POST /api/topics/:id/comments
 * Add a comment to a topic
 * Requires authentication
 */
router.post(
    '/:id/comments',
    protect,
    generalLimiter,
    commentValidation,
    asyncHandler(handleValidationErrors),
    asyncHandler(addComment)
);

module.exports = router;
