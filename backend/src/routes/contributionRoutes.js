const express = require('express');
const contributionController = require('../controllers/contributionController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

const { uploadScreenshot } = require('../utils/upload');
const paymentVerificationController = require('../controllers/paymentVerificationController');

// Any logged-in user: their OWN records only (user id comes from the token)
router.get('/my-history', contributionController.myHistory);
router.get('/my-summary', contributionController.mySummary);

// Group transparency: all authenticated members can view group contribution records
router.get('/month/:year/:month', contributionController.getMonth);
router.get('/history', contributionController.history);

// Admin-only actions
router.post('/create-month', requireAdmin, contributionController.createMonth);
// Admin MUST upload a payment screenshot when marking a contribution as paid
router.patch('/:id/pay', requireAdmin, uploadScreenshot, paymentVerificationController.adminMarkPaid);
router.patch('/:id/unpay', requireAdmin, contributionController.markUnpaid);

module.exports = router;
