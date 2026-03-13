const express = require('express');
const router = express.Router();
const {
  getAllVouchers,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
} = require('../controllers/voucherController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/check/:code', getVoucherByCode);

// Auth routes
router.get('/', authenticate, getAllVouchers);
router.post('/validate', authenticate, validateVoucher);

// Admin routes
router.post('/', authenticate, authorize('admin'), createVoucher);
router.put('/:id', authenticate, authorize('admin'), updateVoucher);
router.delete('/:id', authenticate, authorize('admin'), deleteVoucher);

module.exports = router;
