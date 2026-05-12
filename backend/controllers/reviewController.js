const { Op } = require('sequelize');
const db = require('../models');
const { Review, ProductReview, Appointment, User, Product, Service, Order, OrderItem } = db;

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

const getStaffReviews = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const reviews = await Review.findAll({
      where: { staffId, isHidden: false },
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

const getServiceReviews = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const reviews = await Review.findAll({
        where: { isHidden: false },
        include: [
            { model: User, as: 'customer', attributes: ['id', 'fullName'] },
            {
              model: Appointment,
              as: 'appointment',
              where: { serviceId },
              include: [{ model: User, as: 'staff', attributes: ['fullName'] }]
            }
        ],
        order: [['createdAt', 'DESC']],
    });

    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
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

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await ProductReview.findAll({
      where: { productId, isHidden: false },
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

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

    const purchased = await Order.findOne({
      where: {
        userId,
        status: { [Op.in]: ['delivered', 'completed'] }
      },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { productId }
      }]
    });

    if (!purchased) {
      return res.status(400).json({
        success: false,
        message: 'You can only review products you have purchased and received.',
      });
    }

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

const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const [serviceReviews, productReviews] = await Promise.all([
      Review.findAll({
        include: [
          { model: User, as: 'customer', attributes: ['id', 'fullName', 'phone'] },
          { model: User, as: 'staff', attributes: ['id', 'fullName'] },
          { 
            model: Appointment, 
            as: 'appointment',
            include: [{ model: Service, as: 'service', attributes: ['name'] }]
          },
        ],
        order: [['createdAt', 'DESC']],
      }),
      ProductReview.findAll({
        include: [
          { model: User, as: 'user', attributes: ['id', 'fullName', 'phone'] },
          { model: Product, as: 'product', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const unified = [
      ...serviceReviews.map(r => ({
        ...r.toJSON(),
        type: 'service',
        targetName: r.appointment?.service?.name || 'Dịch vụ',
        customerName: r.customer?.fullName,
        customerPhone: r.customer?.phone,
      })),
      ...productReviews.map(r => ({
        ...r.toJSON(),
        type: 'product',
        targetName: r.product?.name || 'Sản phẩm',
        customerName: r.user?.fullName,
        customerPhone: r.user?.phone,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      data: unified,
    });
  } catch (error) {
    next(error);
  }
};

const updateReviewAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, reply, isHidden } = req.body; // type is 'service' or 'product'

    let review;
    if (type === 'service') {
      review = await Review.findByPk(id);
    } else {
      review = await ProductReview.findByPk(id);
    }

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    if (reply !== undefined) {
      review.reply = reply;
      review.replyAt = new Date();
    }
    
    if (isHidden !== undefined) {
      review.isHidden = isHidden;
    }

    await review.save();

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let review = await Review.findByPk(id);
    let reviewType = 'service';

    if (!review) {
      review = await ProductReview.findByPk(id);
      reviewType = 'product';
    }

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

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
  getServiceReviews,
  getProductReviews,
  createProductReview,
  getAllReviewsAdmin,
  updateReviewAdmin,
  deleteReview,
};
