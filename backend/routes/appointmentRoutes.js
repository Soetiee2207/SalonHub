const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  getAllAppointments,
  getStaffAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAvailableSlots,
  checkoutAppointment,
  checkInAppointment,
  updateUpsellItems,
} = require('../controllers/appointmentController');

// Public routes
router.get('/available-slots', getAvailableSlots);

// Protected routes (require authentication)
router.post('/', authenticate, createAppointment);
router.get('/my-appointments', authenticate, getMyAppointments);
router.get('/staff-appointments', authenticate, authorize('staff', 'admin'), getStaffAppointments);
router.get('/', authenticate, authorize('admin', 'staff'), getAllAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.put('/:id/status', authenticate, authorize('admin', 'staff'), updateAppointmentStatus);
router.put('/:id/cancel', authenticate, cancelAppointment);
router.post('/:id/checkout', authenticate, authorize('admin', 'staff'), checkoutAppointment);
router.post('/:id/check-in', authenticate, authorize('admin', 'staff'), checkInAppointment);
router.put('/:id/upsell', authenticate, authorize('admin', 'staff'), updateUpsellItems);

module.exports = router;
