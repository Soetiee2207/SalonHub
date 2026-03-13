const { Op } = require('sequelize');
const db = require('../models');
const { Appointment, Service, User, Branch, StaffSchedule } = db;

// Helper: add minutes to a time string "HH:MM"
const addMinutes = (time, minutes) => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

// Helper: convert "HH:MM" to total minutes for comparison
const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Helper: check if two time ranges overlap
const timesOverlap = (start1, end1, start2, end2) => {
  return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(start2) < timeToMinutes(end1);
};

// POST / - Customer creates appointment
const createAppointment = async (req, res, next) => {
  try {
    const { branchId, staffId, serviceId, date, startTime, note } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!branchId || !serviceId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'branchId, serviceId, date, and startTime are required.',
      });
    }

    // Get service to calculate endTime and price
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const endTime = addMinutes(startTime, service.duration);
    const totalPrice = service.price;

    // If staffId provided, validate staff availability
    if (staffId) {
      // Check staff schedule for the given day
      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.getDay();

      const schedule = await StaffSchedule.findOne({
        where: {
          userId: staffId,
          branchId,
          dayOfWeek,
        },
      });

      if (!schedule) {
        return res.status(400).json({
          success: false,
          message: 'Staff is not available on this day at this branch.',
        });
      }

      // Check if appointment time falls within staff schedule
      if (
        timeToMinutes(startTime) < timeToMinutes(schedule.startTime) ||
        timeToMinutes(endTime) > timeToMinutes(schedule.endTime)
      ) {
        return res.status(400).json({
          success: false,
          message: `Staff is available from ${schedule.startTime} to ${schedule.endTime} on this day.`,
        });
      }

      // Check for conflicting appointments
      const conflictingAppointment = await Appointment.findOne({
        where: {
          staffId,
          date,
          status: { [Op.notIn]: ['cancelled'] },
          [Op.and]: [
            db.sequelize.literal(
              `(TIME('${startTime}') < TIME(endTime) AND TIME('${endTime}') > TIME(startTime))`
            ),
          ],
        },
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Staff already has an appointment during this time slot.',
        });
      }
    }

    const appointment = await Appointment.create({
      userId,
      staffId: staffId || null,
      branchId,
      serviceId,
      date,
      startTime,
      endTime,
      note: note || null,
      totalPrice,
      status: 'pending',
    });

    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service' },
        { model: Branch, as: 'branch' },
      ],
    });

    return res.status(201).json({
      success: true,
      data: fullAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /my-appointments - Customer gets own appointments
const getMyAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service' },
        { model: Branch, as: 'branch' },
      ],
      order: [['date', 'DESC'], ['startTime', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// GET /:id - Get single appointment
const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service' },
        { model: Branch, as: 'branch' },
      ],
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    // Customer can only see own appointments
    if (req.user.role === 'customer' && appointment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this appointment.',
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// GET / - Admin/staff list all appointments
const getAllAppointments = async (req, res, next) => {
  try {
    const { date, staffId, branchId, status } = req.query;

    const where = {};
    if (date) where.date = date;
    if (staffId) where.staffId = staffId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service' },
        { model: Branch, as: 'branch' },
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// GET /staff-appointments - Staff gets own appointments for date range
const getStaffAppointments = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const { startDate, endDate } = req.query;

    const where = { staffId };

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service' },
        { model: Branch, as: 'branch' },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /:id/status - Admin/staff update appointment status
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    await appointment.update({ status });

    const updatedAppointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service' },
        { model: Branch, as: 'branch' },
      ],
    });

    return res.status(200).json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /:id/cancel - Customer cancels own appointment
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    if (appointment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own appointments.',
      });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or confirmed appointments can be cancelled.',
      });
    }

    await appointment.update({ status: 'cancelled' });

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /available-slots - Public. Get available time slots
const getAvailableSlots = async (req, res, next) => {
  try {
    const { branchId, staffId, serviceId, date } = req.query;

    if (!branchId || !staffId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'branchId, staffId, serviceId, and date are required.',
      });
    }

    // Get service duration
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    // Get staff schedule for the day
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    const schedule = await StaffSchedule.findOne({
      where: {
        userId: staffId,
        branchId,
        dayOfWeek,
      },
    });

    if (!schedule) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get existing appointments for that staff on that date
    const existingAppointments = await Appointment.findAll({
      where: {
        staffId,
        date,
        status: { [Op.notIn]: ['cancelled'] },
      },
      order: [['startTime', 'ASC']],
    });

    // Generate slots in 30-minute intervals within the staff schedule
    const slots = [];
    const slotInterval = 30; // minutes
    const scheduleStart = timeToMinutes(schedule.startTime);
    const scheduleEnd = timeToMinutes(schedule.endTime);

    for (let time = scheduleStart; time + service.duration <= scheduleEnd; time += slotInterval) {
      const slotStart = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
      const slotEnd = addMinutes(slotStart, service.duration);

      // Check if this slot conflicts with any existing appointment
      const hasConflict = existingAppointments.some((appt) =>
        timesOverlap(slotStart, slotEnd, appt.startTime, appt.endTime)
      );

      if (!hasConflict) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  getAllAppointments,
  getStaffAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAvailableSlots,
};
