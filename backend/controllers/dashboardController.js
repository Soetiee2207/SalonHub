const db = require('../models');
const { Op } = require('sequelize');

// Get overview stats
const getOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Total revenue from paid orders this month
    const orderRevenue = await db.Order.findOne({
      where: {
        paymentStatus: 'paid',
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('totalAmount')), 'total'],
      ],
      raw: true,
    });

    // Total revenue from paid appointments (completed) this month
    const appointmentRevenue = await db.Appointment.findOne({
      where: {
        status: 'completed',
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('totalPrice')), 'total'],
      ],
      raw: true,
    });

    const totalRevenue =
      (parseFloat(orderRevenue.total) || 0) +
      (parseFloat(appointmentRevenue.total) || 0);

    // Total orders this month
    const totalOrders = await db.Order.count({
      where: {
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    // Total appointments this month
    const totalAppointments = await db.Appointment.count({
      where: {
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    // Total customers this month
    const totalCustomers = await db.User.count({
      where: {
        role: 'customer',
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalAppointments,
        totalCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get revenue chart data
const getRevenueChart = async (req, res, next) => {
  try {
    const { period } = req.query; // week, month, year
    const now = new Date();
    let startDate, groupBy, dateFormat;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupBy = db.sequelize.fn('DATE', db.sequelize.col('createdAt'));
      dateFormat = 'date';
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupBy = db.sequelize.fn('MONTH', db.sequelize.col('createdAt'));
      dateFormat = 'month';
    } else {
      // Default: month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = db.sequelize.fn('DATE', db.sequelize.col('createdAt'));
      dateFormat = 'date';
    }

    const orderRevenue = await db.Order.findAll({
      where: {
        paymentStatus: 'paid',
        createdAt: { [Op.gte]: startDate },
      },
      attributes: [
        [groupBy, dateFormat],
        [db.sequelize.fn('SUM', db.sequelize.col('totalAmount')), 'revenue'],
      ],
      group: [groupBy],
      raw: true,
    });

    const appointmentRevenue = await db.Appointment.findAll({
      where: {
        status: 'completed',
        createdAt: { [Op.gte]: startDate },
      },
      attributes: [
        [groupBy, dateFormat],
        [db.sequelize.fn('SUM', db.sequelize.col('totalPrice')), 'revenue'],
      ],
      group: [groupBy],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        period: period || 'month',
        orders: orderRevenue,
        appointments: appointmentRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get top 5 most booked services
const getTopServices = async (req, res, next) => {
  try {
    const topServices = await db.Appointment.findAll({
      attributes: [
        'serviceId',
        [db.sequelize.fn('COUNT', db.sequelize.col('Appointment.id')), 'bookingCount'],
      ],
      include: [
        {
          model: db.Service,
          as: 'service',
          attributes: ['id', 'name', 'price', 'image'],
        },
      ],
      group: ['serviceId', 'service.id'],
      order: [[db.sequelize.literal('bookingCount'), 'DESC']],
      limit: 5,
    });

    res.status(200).json({
      success: true,
      data: topServices,
    });
  } catch (error) {
    next(error);
  }
};

// Get top 5 best selling products
const getTopProducts = async (req, res, next) => {
  try {
    const topProducts = await db.OrderItem.findAll({
      attributes: [
        'productId',
        [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'totalSold'],
      ],
      include: [
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image'],
        },
      ],
      group: ['productId', 'product.id'],
      order: [[db.sequelize.literal('totalSold'), 'DESC']],
      limit: 5,
    });

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    next(error);
  }
};

// Get appointment stats by status
const getAppointmentStats = async (req, res, next) => {
  try {
    const stats = await db.Appointment.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get new customer registrations
const getNewCustomers = async (req, res, next) => {
  try {
    const { period } = req.query; // week, month, year
    const now = new Date();
    let startDate, groupBy, dateFormat;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupBy = db.sequelize.fn('DATE', db.sequelize.col('createdAt'));
      dateFormat = 'date';
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupBy = db.sequelize.fn('MONTH', db.sequelize.col('createdAt'));
      dateFormat = 'month';
    } else {
      // Default: month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = db.sequelize.fn('DATE', db.sequelize.col('createdAt'));
      dateFormat = 'date';
    }

    const customers = await db.User.findAll({
      where: {
        role: 'customer',
        createdAt: { [Op.gte]: startDate },
      },
      attributes: [
        [groupBy, dateFormat],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: [groupBy],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        period: period || 'month',
        customers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getRevenueChart,
  getTopServices,
  getTopProducts,
  getAppointmentStats,
  getNewCustomers,
};
