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

router.use(authenticate);

router.get(
  '/available-staff',
  getAvailableStaff
);

router.get(
  '/staff/:userId',
  getStaffWeeklySchedule
);

router.post(
  '/staff/:userId',
  authorize('admin'),
  setStaffSchedules
);

router.get(
  '/',
  authorize('admin', 'service_staff', 'warehouse_staff', 'accountant'),
  getSchedules
);

router.post(
  '/',
  authorize('admin'),
  createSchedule
);

router.put(
  '/:id',
  authorize('admin'),
  updateSchedule
);

router.delete(
  '/:id',
  authorize('admin'),
  deleteSchedule
);

module.exports = router;
