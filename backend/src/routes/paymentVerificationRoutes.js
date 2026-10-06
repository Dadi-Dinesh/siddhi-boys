const express = require('express');
const paymentVerificationController = require('../controllers/paymentVerificationController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { uploadScreenshot } = require('../utils/upload');

const router = express.Router();

router.use(authenticate);

// Member routes (also accessible to admin)
router.post('/', uploadScreenshot, paymentVerificationController.submit);
router.get('/my', paymentVerificationController.my);
router.get('/my/current', paymentVerificationController.myCurrent);
router.get('/:id', paymentVerificationController.getOne);
router.get('/:id/screenshot', paymentVerificationController.getScreenshot);

// Admin routes
router.get('/', requireAdmin, paymentVerificationController.list);
router.patch('/:id/accept', requireAdmin, paymentVerificationController.accept);
router.patch('/:id/decline', requireAdmin, paymentVerificationController.decline);

module.exports = router;
