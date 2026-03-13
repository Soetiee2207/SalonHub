const express = require('express');
const router = express.Router();
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} = require('../controllers/branchController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Public routes
router.get('/', getAllBranches);
router.get('/:id', getBranchById);

// Admin routes
router.post('/', authenticate, authorize('admin'), uploadSingle, createBranch);
router.put('/:id', authenticate, authorize('admin'), uploadSingle, updateBranch);
router.delete('/:id', authenticate, authorize('admin'), deleteBranch);

module.exports = router;
