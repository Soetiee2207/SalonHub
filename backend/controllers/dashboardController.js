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

// GET /api/dashboard/revenue-by-branch
// Doanh thu theo từng chi nhánh (lịch hẹn hoàn thành)
const getRevenueByBranch = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { status: 'completed' };
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    const revenueByBranch = await db.Appointment.findAll({
      where,
      attributes: [
        'branchId',
        [db.sequelize.fn('COUNT', db.sequelize.col('Appointment.id')), 'appointmentCount'],
        [db.sequelize.fn('SUM', db.sequelize.col('totalPrice')), 'totalRevenue'],
      ],
      include: [
        {
          model: db.Branch,
          as: 'branch',
          attributes: ['id', 'name', 'address'],
        },
      ],
      group: ['branchId', 'branch.id'],
      order: [[db.sequelize.literal('totalRevenue'), 'DESC']],
      raw: false,
    });

    res.status(200).json({
      success: true,
      data: revenueByBranch,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/appointments-by-staff
// Số lịch hẹn và doanh thu theo từng nhân viên dịch vụ
const getAppointmentsByStaff = async (req, res, next) => {
  try {
    const { startDate, endDate, branchId } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }
    if (branchId) where.branchId = branchId;

    const statsByStaff = await db.Appointment.findAll({
      where,
      attributes: [
        'staffId',
        [db.sequelize.fn('COUNT', db.sequelize.col('Appointment.id')), 'totalAppointments'],
        [
          db.sequelize.fn(
            'SUM',
            db.sequelize.literal(`CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END`)
          ),
          'completedRevenue',
        ],
        [
          db.sequelize.fn(
            'COUNT',
            db.sequelize.literal(`CASE WHEN status = 'completed' THEN 1 END`)
          ),
          'completedCount',
        ],
        [
          db.sequelize.fn(
            'COUNT',
            db.sequelize.literal(`CASE WHEN status = 'cancelled' THEN 1 END`)
          ),
          'cancelledCount',
        ],
      ],
      include: [
        {
          model: db.User,
          as: 'staff',
          attributes: ['id', 'fullName', 'email', 'role'],
        },
      ],
      group: ['staffId', 'staff.id'],
      order: [[db.sequelize.literal('totalAppointments'), 'DESC']],
      raw: false,
    });

    res.status(200).json({
      success: true,
      data: statsByStaff,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/daily-revenue
// Doanh thu ngày hôm nay (orders + appointments)
const getDailyRevenue = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const orderRev = await db.Order.findOne({
      where: {
        paymentStatus: 'paid',
        createdAt: { [Op.between]: [startOfDay, endOfDay] },
      },
      attributes: [[db.sequelize.fn('SUM', db.sequelize.col('totalAmount')), 'total']],
      raw: true,
    });

    const apptRev = await db.Appointment.findOne({
      where: {
        status: 'completed',
        date: now.toISOString().split('T')[0],
      },
      attributes: [[db.sequelize.fn('SUM', db.sequelize.col('totalPrice')), 'total']],
      raw: true,
    });

    const orderCount = await db.Order.count({
      where: { createdAt: { [Op.between]: [startOfDay, endOfDay] } },
    });

    const apptCount = await db.Appointment.count({
      where: { date: now.toISOString().split('T')[0] },
    });

    res.status(200).json({
      success: true,
      data: {
        dailyRevenue: (parseFloat(orderRev?.total) || 0) + (parseFloat(apptRev?.total) || 0),
        orderRevenue: parseFloat(orderRev?.total) || 0,
        appointmentRevenue: parseFloat(apptRev?.total) || 0,
        dailyOrders: orderCount,
        dailyAppointments: apptCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/top-barbers
// Top thợ cắt tóc được book nhiều nhất
const getTopBarbers = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const topBarbers = await db.Appointment.findAll({
      where: {
        createdAt: { [Op.gte]: startOfMonth },
      },
      attributes: [
        'staffId',
        [db.sequelize.fn('COUNT', db.sequelize.col('Appointment.id')), 'bookingCount'],
        [
          db.sequelize.fn(
            'SUM',
            db.sequelize.literal("CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END")
          ),
          'revenue',
        ],
      ],
      include: [
        {
          model: db.User,
          as: 'staff',
          attributes: ['id', 'fullName', 'avatar'],
        },
      ],
      group: ['staffId', 'staff.id'],
      order: [[db.sequelize.literal('bookingCount'), 'DESC']],
      limit: 5,
    });

    res.status(200).json({
      success: true,
      data: topBarbers,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/hourly-traffic
// Lưu lượng khách theo khung giờ trong ngày (hôm nay hoặc theo ?date=YYYY-MM-DD)
const getHourlyTraffic = async (req, res, next) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const traffic = await db.Appointment.findAll({
      where: { date: targetDate },
      attributes: [
        [db.sequelize.fn('HOUR', db.sequelize.col('startTime')), 'hour'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: [db.sequelize.fn('HOUR', db.sequelize.col('startTime'))],
      order: [[db.sequelize.fn('HOUR', db.sequelize.col('startTime')), 'ASC']],
      raw: true,
    });

    // Fill all hours 8-20
    const fullHours = [];
    for (let h = 8; h <= 20; h++) {
      const found = traffic.find((t) => Number(t.hour) === h);
      fullHours.push({
        hour: h,
        label: `${h}:00`,
        count: found ? Number(found.count) : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: { date: targetDate, hours: fullHours },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/command-center
// All-in-one data for the new dashboard "Hot Alerts" and "Live Schedule"
const getCommandCenter = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Low stock alerts (Physical stock <= minimum stock)
    const lowStock = await db.Product.findAll({
      where: {
        stock: { [Op.lte]: db.sequelize.col('minStock') },
        isActive: true,
      },
      limit: 5,
    });

    // 2. Pending appointments
    const pendingAppointments = await db.Appointment.findAll({
      where: { status: 'pending' },
      include: [
        { model: db.User, as: 'customer', attributes: ['fullName'] },
        { model: db.Service, as: 'service', attributes: ['name'] },
      ],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    // 3. Today's live schedule
    const todaySchedule = await db.Appointment.findAll({
      where: { date: today },
      include: [
        { model: db.User, as: 'customer', attributes: ['fullName'] },
        { model: db.User, as: 'staff', attributes: ['fullName'] },
        { model: db.Service, as: 'service', attributes: ['name'] },
      ],
      limit: 10,
      order: [['startTime', 'ASC']],
    });

    // 4. Recent reviews
    const recentServiceReviews = await db.Review.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: db.User, as: 'customer', attributes: ['fullName'] }],
    });

    res.status(200).json({
      success: true,
      data: {
        lowStock: lowStock.map(p => ({
          type: 'critical',
          title: 'Cảnh báo tồn kho',
          message: `Sản phẩm ${p.name} hiện chỉ còn ${p.stock ?? p.quantity} sản phẩm trong kho. Vui lòng kiểm tra và nhập thêm hàng.`,
          id: p.id,
          icon: 'FiPackage'
        })),
        pendingAppointments: pendingAppointments.map(a => ({
          type: 'warning',
          title: 'Lịch hẹn chờ xác nhận',
          message: `Khách hàng ${a.customer?.fullName} đã đăng ký dịch vụ ${a.service?.name}.`,
          time: a.startTime,
          id: a.id,
          icon: 'FiCalendar'
        })),
        todaySchedule,
        recentReviews: recentServiceReviews.map(r => ({
          type: 'info',
          title: 'Phản hồi mới',
          message: `Khách hàng ${r.customer?.fullName} đã gửi đánh giá: "${r.comment?.slice(0, 30)}..."`,
          id: r.id,
          icon: 'FiStar'
        })),
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
  getRevenueByBranch,
  getAppointmentsByStaff,
  getDailyRevenue,
  getTopBarbers,
  getHourlyTraffic,
  getCommandCenter,
};
