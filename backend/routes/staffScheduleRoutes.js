const express = require('express');
const router = express.Router();
const {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableStaff,
  getStaffWeeklySchedule,
  setStaffSchedules,
} = require('../controllers/staffScheduleController');
const { authenticate, authorize } = require('../middleware/auth');

// ─── Tất cả routes đều yêu cầu đăng nhập ───────────────────
router.use(authenticate);

// GET /api/schedules/available-staff?branchId=&date=
// Danh sách thợ có lịch trong ngày → dùng khi đặt lịch dịch vụ
router.get(
  '/available-staff',
  getAvailableStaff
);

// GET /api/schedules/staff/:userId
// Toàn bộ lịch tuần của một nhân viên
router.get(
  '/staff/:userId',
  getStaffWeeklySchedule
);

// POST /api/schedules/staff/:userId
// Cập nhật toàn bộ lịch tuần (Bulk Update)
router.post(
  '/staff/:userId',
  authorize('admin'),
  setStaffSchedules
);

// GET /api/schedules  — Admin xem tất cả, staff xem của mình
router.get(
  '/',
  authorize('admin', 'service_staff', 'warehouse_staff', 'accountant'),
  getSchedules
);

// POST /api/schedules  — Tạo lịch mới (admin)
router.post(
  '/',
  authorize('admin'),
  createSchedule
);

// PUT /api/schedules/:id  — Cập nhật lịch (admin)
router.put(
  '/:id',
  authorize('admin'),
  updateSchedule
);

// DELETE /api/schedules/:id  — Xóa lịch (admin)
router.delete(
  '/:id',
  authorize('admin'),
  deleteSchedule
);

module.exports = router;
