const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

// All authenticated users can view expenses for group transparency
router.get('/', expenseController.list);
router.get('/:id', expenseController.getOne);

// Only admins can create, update, or remove expenses
router.post('/', requireAdmin, expenseController.create);
router.put('/:id', requireAdmin, expenseController.update);
router.delete('/:id', requireAdmin, expenseController.remove);

module.exports = router;
