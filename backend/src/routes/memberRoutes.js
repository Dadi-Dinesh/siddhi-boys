const express = require('express');
const memberController = require('../controllers/memberController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Every member-management route is admin only.
router.use(authenticate, requireAdmin);

router.get('/', memberController.list);
router.post('/', memberController.create);
router.get('/:id', memberController.getOne);
router.put('/:id', memberController.update);
router.delete('/:id', memberController.deactivate);
router.patch('/:id/activate', memberController.activate);

module.exports = router;
