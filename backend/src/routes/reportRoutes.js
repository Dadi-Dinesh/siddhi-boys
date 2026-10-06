const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', authenticate, requireAdmin, reportController.summary);

module.exports = router;
