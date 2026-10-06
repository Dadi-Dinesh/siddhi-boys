const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, transactionController.list);

module.exports = router;
