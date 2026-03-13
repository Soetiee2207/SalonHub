const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Public routes
router.get('/', getAllServices);
router.get('/categories', getAllCategories);
router.get('/:id', getServiceById);

// Admin routes - services
router.post('/', authenticate, authorize('admin'), uploadSingle, createService);
router.put('/:id', authenticate, authorize('admin'), uploadSingle, updateService);
router.delete('/:id', authenticate, authorize('admin'), deleteService);

// Admin routes - categories
router.post('/categories', authenticate, authorize('admin'), createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
