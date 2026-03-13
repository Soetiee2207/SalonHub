const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffSchedules,
  setStaffSchedule,
  addStaffSkill,
  removeStaffSkill,
} = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.get('/:id/schedules', getStaffSchedules);

// Admin routes
router.post('/', authenticate, authorize('admin'), createStaff);
router.put('/:id', authenticate, authorize('admin'), updateStaff);
router.delete('/:id', authenticate, authorize('admin'), deleteStaff);
router.post('/:id/schedules', authenticate, authorize('admin'), setStaffSchedule);
router.post('/:id/skills', authenticate, authorize('admin'), addStaffSkill);
router.delete('/:id/skills/:serviceId', authenticate, authorize('admin'), removeStaffSkill);

module.exports = router;
