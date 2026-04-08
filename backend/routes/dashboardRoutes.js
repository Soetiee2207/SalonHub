const express = require('express');
const router = express.Router();
const {
  getOverview,
  getRevenueChart,
  getTopServices,
  getTopProducts,
  getAppointmentStats,
  getNewCustomers,
  getRevenueByBranch,
  getAppointmentsByStaff,
  getDailyRevenue,
  getTopBarbers,
  getHourlyTraffic,
  getCommandCenter,
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin or staff roles
router.use(authenticate, authorize('admin', 'service_staff', 'warehouse_staff', 'accountant'));

router.get('/overview', getOverview);
router.get('/revenue', getRevenueChart);
router.get('/top-services', getTopServices);
router.get('/top-products', getTopProducts);
router.get('/appointment-stats', getAppointmentStats);
router.get('/new-customers', getNewCustomers);
router.get('/revenue-by-branch', getRevenueByBranch);
router.get('/appointments-by-staff', getAppointmentsByStaff);
router.get('/daily-revenue', getDailyRevenue);
router.get('/top-barbers', getTopBarbers);
router.get('/hourly-traffic', getHourlyTraffic);
router.get('/command-center', getCommandCenter);

module.exports = router;
