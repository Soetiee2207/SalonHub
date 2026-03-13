const { Op } = require('sequelize');
const db = require('../models');
const { Review, ProductReview, Appointment, User, Product, Service } = db;

// POST /service - Customer creates review for completed appointment
const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId and rating are required.',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5.',
      });
    }

    // Verify appointment exists, belongs to user, and is completed
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    if (appointment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own appointments.',
      });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed appointments.',
      });
    }

    // Check if review already exists for this appointment
    const existingReview = await Review.findOne({ where: { appointmentId, userId } });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this appointment.',
      });
    }

    const review = await Review.create({
      userId,
      staffId: appointment.staffId,
      appointmentId,
      rating,
      comment: comment || null,
    });

    const fullReview = await Review.findByPk(review.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email'] },
        { model: Appointment, as: 'appointment' },
      ],
    });

    return res.status(201).json({
      success: true,
      data: fullReview,
    });
  } catch (error) {
    next(error);
  }
};

// GET /staff/:staffId - Public. Get all reviews for a staff member
const getStaffReviews = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const reviews = await Review.findAll({
      where: { staffId },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName'] },
        {
          model: Appointment,
          as: 'appointment',
          include: [{ model: Service, as: 'service', attributes: ['id', 'name'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = parseFloat((totalRating / reviews.length).toFixed(2));
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /product/:productId - Public. Get all reviews for a product
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await ProductReview.findAll({
      where: { productId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = parseFloat((totalRating / reviews.length).toFixed(2));
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /product - Customer creates product review
const createProductReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'productId and rating are required.',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5.',
      });
    }

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Check if user already reviewed this product
    const existingReview = await ProductReview.findOne({
      where: { userId, productId },
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product.',
      });
    }

    const review = await ProductReview.create({
      userId,
      productId,
      rating,
      comment: comment || null,
    });

    const fullReview = await ProductReview.findByPk(review.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: Product, as: 'product' },
      ],
    });

    return res.status(201).json({
      success: true,
      data: fullReview,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /:id - Admin or review owner can delete
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Try to find in service reviews first
    let review = await Review.findByPk(id);
    let reviewType = 'service';

    if (!review) {
      // Try product reviews
      review = await ProductReview.findByPk(id);
      reviewType = 'product';
    }

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    // Check permission: admin or review owner
    if (userRole !== 'admin' && review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this review.',
      });
    }

    await review.destroy();

    return res.status(200).json({
      success: true,
      data: { message: 'Review deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getStaffReviews,
  getProductReviews,
  createProductReview,
  deleteReview,
};
