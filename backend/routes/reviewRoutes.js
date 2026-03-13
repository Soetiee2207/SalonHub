const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createReview,
  getStaffReviews,
  getProductReviews,
  createProductReview,
  deleteReview,
} = require('../controllers/reviewController');

// Public routes
router.get('/staff/:staffId', getStaffReviews);
router.get('/product/:productId', getProductReviews);

// Protected routes (require authentication)
router.post('/service', authenticate, createReview);
router.post('/product', authenticate, createProductReview);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
