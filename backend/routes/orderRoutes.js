const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');

// Auth required
router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getMyOrders);

// Admin/staff only
router.get('/', authenticate, authorize('admin', 'staff'), getAllOrders);

// Auth required
router.get('/:id', authenticate, getOrderById);

// Admin/staff only
router.put('/:id/status', authenticate, authorize('admin', 'staff'), updateOrderStatus);

// Auth required - cancel own order
router.put('/:id/cancel', authenticate, cancelOrder);

module.exports = router;
