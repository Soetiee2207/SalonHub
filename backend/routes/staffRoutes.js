const express = require('express');
const router = express.Router();
const {
  updateWorkStatus,
  getCustomerHistoryDetail,
  saveCustomerServiceNote,
  getStaffDashboardStats,
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');


router.get('/', authenticate, authorize('admin', 'staff', 'service_staff', 'customer'), getAllStaff);

router.use(authenticate, authorize('admin', 'staff', 'service_staff'));

router.get('/stats', getStaffDashboardStats);
router.put('/status', updateWorkStatus);
router.get('/customer-history/:customerId', getCustomerHistoryDetail);
router.post('/customer-notes', saveCustomerServiceNote);

router.post('/', authorize('admin'), createStaff);
router.put('/:id', authorize('admin'), updateStaff);
router.delete('/:id', authorize('admin'), deleteStaff);

module.exports = router;
