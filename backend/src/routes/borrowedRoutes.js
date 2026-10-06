const express = require('express');
const borrowedController = require('../controllers/borrowedController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

// All authenticated users can view borrowed records for group transparency
router.get('/', borrowedController.list);
router.get('/:id', borrowedController.getOne);

// Only admins can record, return, or remove borrowed money
router.post('/', requireAdmin, borrowedController.create);
router.patch('/:id/return', requireAdmin, borrowedController.markReturned);
router.delete('/:id', requireAdmin, borrowedController.remove);

module.exports = router;
