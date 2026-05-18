const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createImport,
  createExport,
  createAdjustment,
  getProductStock,
  getLowStockProducts,
  getWarehouseStats,
  updateBatchLocation,
  normalizeProductBatches,
  createDamageBatch,
} = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get(
  '/transactions',
  authorize('admin', 'warehouse_staff', 'accountant'),
  getTransactions
);

router.get(
  '/low-stock',
  authorize('admin', 'warehouse_staff'),
  getLowStockProducts
);

router.get(
  '/stats',
  authorize('admin', 'warehouse_staff'),
  getWarehouseStats
);

router.patch(
  '/batches/:id/location',
  authorize('admin', 'warehouse_staff'),
  updateBatchLocation
);

router.post(
  '/products/:id/normalize-batches',
  authorize('admin', 'warehouse_staff'),
  normalizeProductBatches
);

router.get(
  '/products/:id/stock',
  authorize('admin', 'warehouse_staff', 'accountant'),
  getProductStock
);

router.post(
  '/import',
  authorize('admin', 'warehouse_staff'),
  createImport
);

router.post(
  '/export',
  authorize('admin', 'warehouse_staff'),
  createExport
);

router.post(
  '/adjust',
  authorize('admin', 'warehouse_staff'),
  createAdjustment
);

router.post(
  '/damage-batch',
  authorize('admin', 'warehouse_staff'),
  createDamageBatch
);

module.exports = router;
