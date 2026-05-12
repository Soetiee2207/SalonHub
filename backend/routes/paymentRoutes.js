const express = require('express');
const router = express.Router();
const {
  sepayWebhook,
  getPayments,
  getPaymentById,
  refundPayment,
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/sepay-webhook', sepayWebhook);

router.get('/', authenticate, authorize('admin'), getPayments);
router.get('/:id', authenticate, getPaymentById);
router.post('/:id/refund', authenticate, authorize('admin'), refundPayment);

module.exports = router;
