const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { authenticate, authorize } = require('../middleware/auth');

// Dashboard/Admin routes (must be staff/admin/warehouse_staff)
router.get('/all', authenticate, authorize('admin', 'staff', 'warehouse_staff'), returnController.getAllReturnRequests);
router.patch('/:id/status', authenticate, authorize('admin', 'staff', 'warehouse_staff'), returnController.updateReturnRequestStatus);

// Customer routes
router.post('/request', authenticate, returnController.createReturnRequest);
router.get('/my', authenticate, returnController.getMyReturnRequests);

module.exports = router;
