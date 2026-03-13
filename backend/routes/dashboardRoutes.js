const express = require('express');
const router = express.Router();
const {
  getOverview,
  getRevenueChart,
  getTopServices,
  getTopProducts,
  getAppointmentStats,
  getNewCustomers,
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin
router.use(authenticate, authorize('admin'));

router.get('/overview', getOverview);
router.get('/revenue', getRevenueChart);
router.get('/top-services', getTopServices);
router.get('/top-products', getTopProducts);
router.get('/appointment-stats', getAppointmentStats);
router.get('/new-customers', getNewCustomers);

module.exports = router;
