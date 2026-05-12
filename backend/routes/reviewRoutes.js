const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createReview,
  getStaffReviews,
  getServiceReviews,
  getProductReviews,
  createProductReview,
  getAllReviewsAdmin,
  updateReviewAdmin,
  deleteReview,
} = require('../controllers/reviewController');

router.get('/staff/:staffId', getStaffReviews);
router.get('/service/:serviceId', getServiceReviews);
router.get('/product/:productId', getProductReviews);

router.post('/service', authenticate, createReview);
router.post('/product', authenticate, createProductReview);

router.get('/', authenticate, authorize('admin'), getAllReviewsAdmin);
router.put('/:id', authenticate, authorize('admin'), updateReviewAdmin);

router.delete('/:id', authenticate, deleteReview);

module.exports = router;
