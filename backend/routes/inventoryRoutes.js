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
} = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

// ─── Tất cả routes đều yêu cầu đăng nhập ───────────────────
router.use(authenticate);

// GET /api/inventory/transactions  — Lịch sử toàn bộ giao dịch kho
router.get(
  '/transactions',
  authorize('admin', 'warehouse_staff', 'accountant'),
  getTransactions
);

// GET /api/inventory/low-stock  — Sản phẩm sắp hết hàng
router.get(
  '/low-stock',
  authorize('admin', 'warehouse_staff'),
  getLowStockProducts
);

// GET /api/inventory/stats  — Thống kê Dashboard Thủ Kho
router.get(
  '/stats',
  authorize('admin', 'warehouse_staff'),
  getWarehouseStats
);

// GET /api/inventory/products/:id/stock  — Tồn kho + lịch sử của 1 sản phẩm
router.get(
  '/products/:id/stock',
  authorize('admin', 'warehouse_staff', 'accountant'),
  getProductStock
);

// POST /api/inventory/import  — Nhập hàng vào kho
router.post(
  '/import',
  authorize('admin', 'warehouse_staff'),
  createImport
);

// POST /api/inventory/export  — Xuất hàng thủ công khỏi kho
router.post(
  '/export',
  authorize('admin', 'warehouse_staff'),
  createExport
);

// POST /api/inventory/adjust  — Điều chỉnh tồn kho (kiểm kê) — chỉ admin
router.post(
  '/adjust',
  authorize('admin'),
  createAdjustment
);

module.exports = router;
