const express = require('express');
const router = express.Router();
const cache = require('../middleware/cacheMiddleware');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/productController');

router.get('/', cache('products', 3600), getAllProducts);
router.get('/categories', getAllCategories);
router.get('/:id', getProductById);

router.post('/', authenticate, authorize('admin'), uploadSingle, createProduct);
router.put('/:id', authenticate, authorize('admin'), uploadSingle, updateProduct);
router.post('/bulk-delete', authenticate, authorize('admin'), bulkDeleteProducts);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

router.post('/categories', authenticate, authorize('admin'), createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
