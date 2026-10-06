const express = require('express');
const settingsController = require('../controllers/settingsController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', settingsController.get);
router.patch('/', settingsController.update);

module.exports = router;
