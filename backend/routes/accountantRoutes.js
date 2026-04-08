const express = require('express');
const router = express.Router();
const {
  getFinancialStats,
  getCashFlow,
  createCashFlow,
  getReconciliation,
  reconcilePayment,
  getRefundRequests,
  processRefund
} = require('../controllers/accountantController');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả các route yêu cầu đăng nhập và vai trò admin hoặc accountant
router.use(authenticate, authorize('admin', 'accountant'));

// Dashboard & Stats
router.get('/stats', getFinancialStats);

// Sổ quỹ (Cash Flow)
router.get('/cash-flow', getCashFlow);
router.post('/cash-flow', createCashFlow);

// Đối soát (Reconciliation)
router.get('/reconciliation', getReconciliation);
router.post('/reconciliation/:id', reconcilePayment);

// Hoàn tiền (Refunds)
router.get('/refunds', getRefundRequests);
router.post('/refunds/:id/process', processRefund);

module.exports = router;
