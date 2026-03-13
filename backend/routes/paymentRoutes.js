const express = require('express');
const router = express.Router();
const {
  vnpayReturn,
  vnpayIPN,
  getPayments,
  getPaymentById,
  refundPayment,
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes - VNPay callbacks
router.get('/vnpay-return', vnpayReturn);
router.get('/vnpay-ipn', vnpayIPN);

// Admin routes
router.get('/', authenticate, authorize('admin'), getPayments);

// Auth routes
router.get('/:id', authenticate, getPaymentById);

// Admin routes
router.post('/:id/refund', authenticate, authorize('admin'), refundPayment);

module.exports = router;
