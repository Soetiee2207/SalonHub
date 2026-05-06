const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerDetails,
  updateCustomer,
  toggleCustomerStatus,
  deleteCustomer,
} = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

// CRM routes (Admin/Accountant)
router.get('/', authenticate, authorize('admin', 'accountant'), getAllCustomers);
router.get('/:id', authenticate, authorize('admin', 'accountant'), getCustomerDetails);
router.put('/:id', authenticate, authorize('admin'), updateCustomer);
router.patch('/:id/toggle-status', authenticate, authorize('admin'), toggleCustomerStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteCustomer);

module.exports = router;
