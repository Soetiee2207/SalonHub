const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderStatus,
  cancelOrder,
  confirmOrderReceipt,
} = require('../controllers/orderController');

// Auth required
router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getMyOrders);
router.put('/:id/confirm-receipt', authenticate, confirmOrderReceipt);

// Admin/staff/warehouse/accountant
router.get('/', authenticate, authorize('admin', 'staff', 'warehouse_staff', 'accountant'), getAllOrders);

// Auth required
router.get('/:id', authenticate, getOrderById);
router.get('/:id/status', authenticate, getOrderStatus);

// Admin/staff/warehouse/accountant
router.put('/:id/status', authenticate, authorize('admin', 'staff', 'warehouse_staff', 'accountant'), updateOrderStatus);

// Auth required - cancel own order
router.put('/:id/cancel', authenticate, cancelOrder);

module.exports = router;
