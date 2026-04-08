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

// Router: /api/staff

// Các route công khai hoặc cho phép khách hàng (Phục vụ đặt lịch)
router.get('/', authenticate, authorize('admin', 'staff', 'service_staff', 'customer'), getAllStaff);

// Tất cả các route bên dưới yêu cầu đăng nhập và vai trò quản lý/nhân viên cụ thể
router.use(authenticate, authorize('admin', 'staff', 'service_staff'));

router.get('/stats', getStaffDashboardStats);
router.put('/status', updateWorkStatus);
router.get('/customer-history/:customerId', getCustomerHistoryDetail);
router.post('/customer-notes', saveCustomerServiceNote);

router.post('/', authorize('admin'), createStaff);
router.put('/:id', authorize('admin'), updateStaff);
router.delete('/:id', authorize('admin'), deleteStaff);

module.exports = router;
