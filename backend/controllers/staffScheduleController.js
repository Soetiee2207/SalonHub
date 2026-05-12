const { Op } = require('sequelize');
const db = require('../models');
const { StaffSchedule, User, Branch } = db;

const getSchedules = async (req, res, next) => {
  try {
    const { userId, branchId, dayOfWeek } = req.query;
    const requestingUser = req.user;

    const where = {};

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

const createSchedule = async (req, res, next) => {
  try {
    const { userId, branchId, dayOfWeek, startTime, endTime } = req.body;

    if (userId === undefined || branchId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'userId, branchId, dayOfWeek, startTime và endTime là bắt buộc.',
      });
    }

    if (parseInt(dayOfWeek) < 0 || parseInt(dayOfWeek) > 6) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek phải từ 0 (Chủ nhật) đến 6 (Thứ 7).',
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'startTime phải trước endTime.',
      });
    }

    const staff = await User.findByPk(userId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Nhân viên không tồn tại.',
      });
    }

    const staffRoles = ['service_staff', 'warehouse_staff', 'accountant', 'admin'];
    if (!staffRoles.includes(staff.role)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể tạo lịch cho nhân viên (không phải khách hàng).',
      });
    }

    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Chi nhánh không tồn tại.',
      });
    }

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

const getStaffWeeklySchedule = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

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

const setStaffSchedules = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { userId } = req.params;
    const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime }

    const staff = await User.findByPk(userId, { transaction });
    if (!staff) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });
    }

    await StaffSchedule.destroy({
      where: { userId },
      transaction
    });

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
