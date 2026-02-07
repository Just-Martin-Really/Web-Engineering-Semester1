const express = require('express');
const router = express.Router();
const { getTopics, createTopic } = require('../controllers/topicController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getTopics);
router.post('/', protect, createTopic);

module.exports = router;
