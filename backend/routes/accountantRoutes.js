const express = require('express');
const router = express.Router();
const {
  getFinancialStats,
  getCashFlow,
  createCashFlow,
  getReconciliation,
  reconcilePayment,
  getRefundRequests,
  processRefund,
  getReferenceDetail
} = require('../controllers/accountantController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'accountant'));

router.get('/stats', getFinancialStats);

router.get('/cash-flow', getCashFlow);
router.post('/cash-flow', createCashFlow);

router.get('/reconciliation', getReconciliation);
router.post('/reconciliation/:id', reconcilePayment);

router.get('/refunds', getRefundRequests);
router.post('/refunds/:id/process', processRefund);

router.get('/reference-detail/:type/:id', getReferenceDetail);

module.exports = router;
