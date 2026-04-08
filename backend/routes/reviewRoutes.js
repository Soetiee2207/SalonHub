const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createReview,
  getStaffReviews,
  getProductReviews,
  createProductReview,
  getAllReviewsAdmin,
  updateReviewAdmin,
  deleteReview,
} = require('../controllers/reviewController');

// Public routes
router.get('/staff/:staffId', getStaffReviews);
router.get('/product/:productId', getProductReviews);

// Protected routes (require authentication)
router.post('/service', authenticate, createReview);
router.post('/product', authenticate, createProductReview);

// Admin routes
router.get('/', authenticate, authorize('admin'), getAllReviewsAdmin);
router.put('/:id', authenticate, authorize('admin'), updateReviewAdmin);

router.delete('/:id', authenticate, deleteReview);

module.exports = router;
