const db = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get all staff members
const getAllStaff = async (req, res, next) => {
  try {
    const staff = await db.User.findAll({
      where: { role: 'staff' },
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Branch, as: 'branch' },
        {
          model: db.StaffSkill,
          as: 'skills',
          include: [{ model: db.Service, as: 'service' }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// Get staff by ID
const getStaffById = async (req, res, next) => {
  try {
    const staff = await db.User.findOne({
      where: { id: req.params.id, role: 'staff' },
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Branch, as: 'branch' },
        {
          model: db.StaffSkill,
          as: 'skills',
          include: [{ model: db.Service, as: 'service' }],
        },
        {
          model: db.StaffSchedule,
          as: 'schedules',
          include: [{ model: db.Branch, as: 'branch' }],
        },
      ],
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    // Calculate average review rating
    const avgRating = await db.Review.findOne({
      where: { staffId: req.params.id },
      attributes: [
        [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'averageRating'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalReviews'],
      ],
      raw: true,
    });

    const staffData = staff.toJSON();
    staffData.averageRating = avgRating.averageRating
      ? parseFloat(parseFloat(avgRating.averageRating).toFixed(1))
      : null;
    staffData.totalReviews = parseInt(avgRating.totalReviews) || 0;

    res.status(200).json({
      success: true,
      data: staffData,
    });
  } catch (error) {
    next(error);
  }
};

// Create staff (admin only)
const createStaff = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, branchId, serviceIds } = req.body;

    // Check if email already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await db.User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      role: 'staff',
      branchId: branchId || null,
    });

    // Assign skills if provided
    if (serviceIds && serviceIds.length > 0) {
      const skillRecords = serviceIds.map((serviceId) => ({
        userId: staff.id,
        serviceId,
      }));
      await db.StaffSkill.bulkCreate(skillRecords);
    }

    const staffWithDetails = await db.User.findByPk(staff.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Branch, as: 'branch' },
        {
          model: db.StaffSkill,
          as: 'skills',
          include: [{ model: db.Service, as: 'service' }],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: staffWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

// Update staff (admin only)
const updateStaff = async (req, res, next) => {
  try {
    const staff = await db.User.findOne({
      where: { id: req.params.id, role: 'staff' },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    const { fullName, email, phone, branchId, serviceIds } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (branchId !== undefined) updateData.branchId = branchId;

    await staff.update(updateData);

    // Update skills if provided
    if (serviceIds !== undefined) {
      await db.StaffSkill.destroy({ where: { userId: staff.id } });
      if (serviceIds.length > 0) {
        const skillRecords = serviceIds.map((serviceId) => ({
          userId: staff.id,
          serviceId,
        }));
        await db.StaffSkill.bulkCreate(skillRecords);
      }
    }

    const updatedStaff = await db.User.findByPk(staff.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Branch, as: 'branch' },
        {
          model: db.StaffSkill,
          as: 'skills',
          include: [{ model: db.Service, as: 'service' }],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: updatedStaff,
    });
  } catch (error) {
    next(error);
  }
};

// Delete staff (admin only) - soft approach
const deleteStaff = async (req, res, next) => {
  try {
    const staff = await db.User.findOne({
      where: { id: req.params.id, role: 'staff' },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    await staff.update({ role: 'customer' });

    // Remove schedules and skills
    await db.StaffSchedule.destroy({ where: { userId: staff.id } });
    await db.StaffSkill.destroy({ where: { userId: staff.id } });

    res.status(200).json({
      success: true,
      data: { message: 'Staff member deactivated successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

// Get staff schedules
const getStaffSchedules = async (req, res, next) => {
  try {
    const staff = await db.User.findOne({
      where: { id: req.params.id, role: 'staff' },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    const schedules = await db.StaffSchedule.findAll({
      where: { userId: req.params.id },
      include: [{ model: db.Branch, as: 'branch' }],
      order: [['dayOfWeek', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

// Set staff schedule (admin only)
const setStaffSchedule = async (req, res, next) => {
  try {
    const staff = await db.User.findOne({
      where: { id: req.params.id, role: 'staff' },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({
        success: false,
        message: 'Schedules must be an array of {dayOfWeek, startTime, endTime}.',
      });
    }

    // Remove existing schedules
    await db.StaffSchedule.destroy({ where: { userId: staff.id } });

    // Create new schedules
    const scheduleRecords = schedules.map((s) => ({
      userId: staff.id,
      branchId: staff.branchId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    await db.StaffSchedule.bulkCreate(scheduleRecords);

    const updatedSchedules = await db.StaffSchedule.findAll({
      where: { userId: staff.id },
      include: [{ model: db.Branch, as: 'branch' }],
      order: [['dayOfWeek', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: updatedSchedules,
    });
  } catch (error) {
    next(error);
  }
};

// Add staff skill (admin only)
const addStaffSkill = async (req, res, next) => {
  try {
    const staff = await db.User.findOne({
      where: { id: req.params.id, role: 'staff' },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    const { serviceId } = req.body;

    // Check if service exists
    const service = await db.Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    // Check if skill already exists
    const existingSkill = await db.StaffSkill.findOne({
      where: { userId: staff.id, serviceId },
    });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: 'Staff already has this skill.',
      });
    }

    const skill = await db.StaffSkill.create({
      userId: staff.id,
      serviceId,
    });

    const skillWithService = await db.StaffSkill.findByPk(skill.id, {
      include: [{ model: db.Service, as: 'service' }],
    });

    res.status(201).json({
      success: true,
      data: skillWithService,
    });
  } catch (error) {
    next(error);
  }
};

// Remove staff skill (admin only)
const removeStaffSkill = async (req, res, next) => {
  try {
    const staff = await db.User.findOne({
      where: { id: req.params.id, role: 'staff' },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    const skill = await db.StaffSkill.findOne({
      where: { userId: staff.id, serviceId: req.params.serviceId },
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found for this staff member.',
      });
    }

    await skill.destroy();

    res.status(200).json({
      success: true,
      data: { message: 'Skill removed successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffSchedules,
  setStaffSchedule,
  addStaffSkill,
  removeStaffSkill,
};
