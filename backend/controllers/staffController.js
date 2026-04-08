const { Op } = require('sequelize');
const db = require('../models');
const { User, Appointment, Service, Order, OrderItem, Product, CustomerServiceNote, Branch, Review, sequelize } = db;

// ============================================================
// PUT /api/staff/status
// Cập nhật trạng thái làm việc của thợ (Available, Break, Busy)
// ============================================================
const updateWorkStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['available', 'break', 'busy'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    await User.update({ workStatus: status }, { where: { id: req.user.id } });
    res.json({ success: true, message: 'Cập nhật trạng thái thành công', status });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/staff/customer-history/:customerId
// Lấy lịch sử làm tóc và bí kíp (công thức hóa chất) của một khách
// ============================================================
const getCustomerHistoryDetail = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const appointments = await Appointment.findAll({
      where: { userId: customerId, status: 'completed' },
      include: [
        { model: Service, as: 'service', attributes: ['name', 'price'] },
        { 
          model: Order, 
          as: 'upsellOrder', 
          include: [{ 
            model: OrderItem, 
            as: 'items', 
            include: [{ model: Product, as: 'product', attributes: ['name'] }] 
          }] 
        },
        { model: CustomerServiceNote, as: 'notes' }
      ],
      order: [['date', 'DESC'], ['startTime', 'DESC']]
    });

    // Lấy tất cả ghi chú tích lũy cho khách hàng này
    const allNotes = await CustomerServiceNote.findAll({
      where: { customerId },
      include: [{ model: User, as: 'staff', attributes: ['fullName'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        appointments,
        allNotes
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/staff/customer-notes
// Lưu công thức hóa chất hoặc ghi chú phục vụ khách
// ============================================================
const saveCustomerServiceNote = async (req, res, next) => {
  try {
    const { customerId, appointmentId, serviceId, notes, formulas, photos } = req.body;
    
    const serviceNote = await CustomerServiceNote.create({
      customerId,
      staffId: req.user.id,
      appointmentId,
      serviceId,
      notes,
      formulas,
      photos // JSON
    });

    res.status(201).json({ success: true, data: serviceNote });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/staff/dashboard-stats
// Thống kê nhanh cho thợ (Lịch hôm nay, Review gần đây)
// ============================================================
const getStaffDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const staffId = req.user.id;

    const todayAppts = await Appointment.count({
      where: { staffId, date: today, status: { [Op.ne]: 'cancelled' } }
    });

    const pendingAppts = await Appointment.count({
      where: { staffId, date: today, status: { [Op.in]: ['pending', 'confirmed'] } }
    });

    const completedAppts = await Appointment.count({
      where: { staffId, date: today, status: 'completed' }
    });

    // Tính điểm đánh giá trung bình
    const reviews = await Review.findAll({
      where: { staffId, isHidden: false },
      attributes: ['rating']
    });
    
    let avgRating = 5.0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((s, r) => s + r.rating, 0);
      avgRating = parseFloat((sum / reviews.length).toFixed(1));
    }

    res.json({
      success: true,
      data: {
        todayTotal: todayAppts,
        pending: pendingAppts,
        completed: completedAppts,
        workStatus: req.user.workStatus,
        averageRating: avgRating,
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/staff
// Lấy danh sách tất cả nhân viên (dành cho Admin/Quản lý)
// ============================================================
const getAllStaff = async (req, res, next) => {
  try {
    const { branchId, serviceId } = req.query;
    const where = {
      role: { [Op.in]: ['admin', 'staff', 'service_staff', 'accountant', 'warehouse_staff'] }
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const include = [
      { model: Branch, as: 'branch', attributes: ['name'] },
      { 
        model: db.Service, 
        as: 'skilledServices', 
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }
    ];

    // Lọc theo kĩ năng nếu có serviceId
    if (serviceId) {
      include[1].where = { id: serviceId };
    }

    const staff = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include,
      order: [['fullName', 'ASC']]
    });
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/staff
// Thêm nhân viên mới (Admin only)
// ============================================================
const createStaff = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, role, branchId } = req.body;
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const staff = await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      role,
      branchId,
      isActive: true
    });

    if (req.body.serviceIds && Array.isArray(req.body.serviceIds)) {
      await staff.setSkilledServices(req.body.serviceIds);
    }

    const result = staff.toJSON();
    delete result.password;
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PUT /api/staff/:id
// Cập nhật thông tin nhân viên (Admin only)
// ============================================================
const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { serviceIds, ...userFields } = req.body;
    delete userFields.password; // Không cho phép đổi pass qua đây

    const staff = await User.findByPk(id);
    if (!staff) {
        return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });
    }

    await staff.update(userFields);

    if (serviceIds && Array.isArray(serviceIds)) {
      await staff.setSkilledServices(serviceIds);
    }

    res.json({ success: true, message: 'Cập nhật nhân viên thành công' });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE /api/staff/:id
// Xóa nhân viên (Admin only)
// ============================================================
const deleteStaff = async (req, res, next) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Xóa nhân viên thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateWorkStatus,
  getCustomerHistoryDetail,
  saveCustomerServiceNote,
  getStaffDashboardStats,
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff
};
