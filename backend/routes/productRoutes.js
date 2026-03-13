const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/productController');

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getAllCategories);
router.get('/:id', getProductById);

// Admin only routes - products
router.post('/', authenticate, authorize('admin'), uploadSingle, createProduct);
router.put('/:id', authenticate, authorize('admin'), uploadSingle, updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

// Admin only routes - categories
router.post('/categories', authenticate, authorize('admin'), createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
