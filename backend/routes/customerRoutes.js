const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerDetails,
  updateCustomer,
  toggleCustomerStatus,
} = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

// CRM routes (Admin/Accountant)
router.get('/', authenticate, authorize('admin', 'accountant'), getAllCustomers);
router.get('/:id', authenticate, authorize('admin', 'accountant'), getCustomerDetails);
router.put('/:id', authenticate, authorize('admin'), updateCustomer);
router.patch('/:id/toggle-status', authenticate, authorize('admin'), toggleCustomerStatus);

module.exports = router;
