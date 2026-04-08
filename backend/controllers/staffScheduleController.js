const { Op } = require('sequelize');
const db = require('../models');
const { StaffSchedule, User, Branch } = db;

// ============================================================
// GET /api/schedules
// Lấy danh sách lịch làm việc — lọc theo userId, branchId
// Admin: xem tất cả | Staff: chỉ xem lịch của mình
// ============================================================
const getSchedules = async (req, res, next) => {
  try {
    const { userId, branchId, dayOfWeek } = req.query;
    const requestingUser = req.user;

    const where = {};

    // Nếu là staff (không phải admin), chỉ xem lịch của chính mình
    if (!['admin'].includes(requestingUser.role)) {
      where.userId = requestingUser.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (branchId) where.branchId = branchId;
    if (dayOfWeek !== undefined) where.dayOfWeek = dayOfWeek;

    const schedules = await StaffSchedule.findAll({
      where,
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'fullName', 'email', 'phone', 'role'],
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'address'],
        },
      ],
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
    });

    return res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/schedules
// Tạo lịch làm việc mới cho nhân viên
// Quyền: admin
// ============================================================
const createSchedule = async (req, res, next) => {
  try {
    const { userId, branchId, dayOfWeek, startTime, endTime } = req.body;

    // Validate bắt buộc
    if (userId === undefined || branchId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'userId, branchId, dayOfWeek, startTime và endTime là bắt buộc.',
      });
    }

    // Validate dayOfWeek (0 = Chủ nhật, 6 = Thứ 7)
    if (parseInt(dayOfWeek) < 0 || parseInt(dayOfWeek) > 6) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek phải từ 0 (Chủ nhật) đến 6 (Thứ 7).',
      });
    }

    // Validate thời gian
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'startTime phải trước endTime.',
      });
    }

    // Kiểm tra nhân viên tồn tại
    const staff = await User.findByPk(userId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Nhân viên không tồn tại.',
      });
    }

    // Kiểm tra nhân viên có phải là staff role không
    const staffRoles = ['service_staff', 'warehouse_staff', 'accountant', 'admin'];
    if (!staffRoles.includes(staff.role)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể tạo lịch cho nhân viên (không phải khách hàng).',
      });
    }

    // Kiểm tra chi nhánh tồn tại
    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Chi nhánh không tồn tại.',
      });
    }

    // Kiểm tra xung đột lịch (cùng nhân viên, cùng ngày, trùng giờ)
    const existing = await StaffSchedule.findOne({
      where: { userId, branchId, dayOfWeek },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Nhân viên đã có lịch làm việc vào ${getDayName(dayOfWeek)} tại chi nhánh này (${existing.startTime} - ${existing.endTime}). Vui lòng cập nhật lịch hiện có.`,
      });
    }

    const schedule = await StaffSchedule.create({
      userId,
      branchId,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
    });

    const result = await StaffSchedule.findByPk(schedule.id, {
      include: [
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'role'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'address'] },
      ],
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PUT /api/schedules/:id
// Cập nhật lịch làm việc
// Quyền: admin
// ============================================================
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, dayOfWeek, branchId } = req.body;

    const schedule = await StaffSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Lịch làm việc không tồn tại.',
      });
    }

    const newStartTime = startTime || schedule.startTime;
    const newEndTime = endTime || schedule.endTime;

    if (newStartTime >= newEndTime) {
      return res.status(400).json({
        success: false,
        message: 'startTime phải trước endTime.',
      });
    }

    await schedule.update({
      startTime: newStartTime,
      endTime: newEndTime,
      dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : schedule.dayOfWeek,
      branchId: branchId || schedule.branchId,
    });

    const result = await StaffSchedule.findByPk(id, {
      include: [
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'role'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'address'] },
      ],
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE /api/schedules/:id
// Xóa lịch làm việc
// Quyền: admin
// ============================================================
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await StaffSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Lịch làm việc không tồn tại.',
      });
    }

    await schedule.destroy();

    return res.json({
      success: true,
      message: 'Đã xóa lịch làm việc.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/schedules/available-staff
// Lấy danh sách nhân viên có lịch làm việc trong ngày cụ thể
// Dùng cho màn hình đặt lịch dịch vụ — chọn thợ
// Quyền: authenticated
// ============================================================
const getAvailableStaff = async (req, res, next) => {
  try {
    const { branchId, date } = req.query;

    if (!branchId || !date) {
      return res.status(400).json({
        success: false,
        message: 'branchId và date là bắt buộc.',
      });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    const schedules = await StaffSchedule.findAll({
      where: { branchId, dayOfWeek },
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatar', 'role'],
          where: { isActive: true },
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
        },
      ],
      order: [['startTime', 'ASC']],
    });

    return res.json({
      success: true,
      data: schedules.map((s) => ({
        scheduleId: s.id,
        availableFrom: s.startTime,
        availableUntil: s.endTime,
        dayOfWeek: s.dayOfWeek,
        staff: s.staff,
        branch: s.branch,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/schedules/staff/:userId
// Xem toàn bộ lịch tuần của một nhân viên cụ thể
// Quyền: admin, hoặc chính nhân viên đó
// ============================================================
const getStaffWeeklySchedule = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Nhân viên chỉ xem lịch của mình
    if (requestingUser.role !== 'admin' && requestingUser.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch của nhân viên khác.',
      });
    }

    const staff = await User.findByPk(userId, {
      attributes: ['id', 'fullName', 'email', 'role'],
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Nhân viên không tồn tại.',
      });
    }

    const schedules = await StaffSchedule.findAll({
      where: { userId },
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'address'] },
      ],
      order: [['dayOfWeek', 'ASC']],
    });

    // Map dayOfWeek 0-6 thành tên ngày tiếng Việt
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    return res.json({
      success: true,
      data: {
        staff,
        weeklySchedule: schedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          dayName: dayNames[s.dayOfWeek],
          startTime: s.startTime,
          endTime: s.endTime,
          branch: s.branch,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/schedules/staff/:userId
// Cập nhật toàn bộ lịch tuần của một nhân viên (Bulk Set)
// Quyền: admin
// ============================================================
const setStaffSchedules = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { userId } = req.params;
    const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime }

    // 1. Kiểm tra nhân viên tồn tại
    const staff = await User.findByPk(userId, { transaction });
    if (!staff) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });
    }

    // 2. Xóa toàn bộ lịch cũ
    await StaffSchedule.destroy({
      where: { userId },
      transaction
    });

    // 3. Tạo lịch mới từ danh sách gửi lên
    const createdSchedules = [];
    if (schedules && Array.isArray(schedules)) {
      for (const item of schedules) {
        const sch = await StaffSchedule.create({
          userId: parseInt(userId),
          branchId: staff.branchId, // Mặc định theo chi nhánh của nhân viên
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime
        }, { transaction });
        createdSchedules.push(sch);
      }
    }

    await transaction.commit();
    res.json({
      success: true,
      message: 'Đã cập nhật lịch làm việc hàng tuần cho nhân viên',
      data: createdSchedules
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

// Helper: tên ngày tiếng Việt
function getDayName(dayOfWeek) {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[parseInt(dayOfWeek)] || 'Không xác định';
}

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableStaff,
  getStaffWeeklySchedule,
  setStaffSchedules,
};
