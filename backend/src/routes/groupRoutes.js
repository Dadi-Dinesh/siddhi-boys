const express = require('express');
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Any logged-in user (admin or member)
router.get('/summary', authenticate, groupController.summary);

module.exports = router;
