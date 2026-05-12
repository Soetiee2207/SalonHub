const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  bulkDeleteServices,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.get('/', getAllServices);
router.get('/categories', getAllCategories);
router.get('/:id', getServiceById);

router.post('/', authenticate, authorize('admin'), uploadSingle, createService);
router.put('/:id', authenticate, authorize('admin'), uploadSingle, updateService);
router.post('/bulk-delete', authenticate, authorize('admin'), bulkDeleteServices);
router.delete('/:id', authenticate, authorize('admin'), deleteService);

router.post('/categories', authenticate, authorize('admin'), createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
