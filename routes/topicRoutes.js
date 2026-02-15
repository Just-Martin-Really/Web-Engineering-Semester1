const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const { asyncHandler } = require('../middleware/validationMiddleware');
const {
    topicValidation,
    handleValidationErrors
} = require('../utils/validationRules');
const {
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic
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
 * PUT /api/topics/:id
 * Update an existing topic
 * Requires authentication (only author can update)
 * Input validation required
 */
router.put(
    '/:id',
    protect,
    generalLimiter,
    topicValidation,
    asyncHandler(handleValidationErrors),
    asyncHandler(updateTopic)
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

module.exports = router;
