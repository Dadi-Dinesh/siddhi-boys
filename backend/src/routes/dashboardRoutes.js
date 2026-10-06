const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/summary', dashboardController.summary);
router.get('/monthly-summary', dashboardController.monthlySummary);

module.exports = router;
