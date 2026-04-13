const bcrypt = require('bcryptjs');
const db = require('../models');
const { 
  Appointment, Service, User, Branch, StaffSchedule, 
  Order, OrderItem, Product, Payment, RefundRequest,
  InventoryTransaction, CashFlowTransaction 
} = db;
const { createNotification } = require('./notificationController');
const { updateCustomerLoyalty } = require('../utils/loyaltyHelper');
const { generateVnpayUrl } = require('../utils/vnpayHelper');

// ============================================================
// Constants
// ============================================================

const SLOT_INTERVAL_MINUTES = 30;

const STATUS_TRANSITIONS = {
  awaiting_deposit: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Deposit is 100% of service price
const DEPOSIT_RATE = 1.0;
// Auto-cancel appointments if deposit not paid within 30 minutes
const DEPOSIT_TIMEOUT_MINUTES = 30;

const APPOINTMENT_INCLUDES = [
  { model: User, as: 'customer', attributes: ['id', 'fullName', 'email', 'phone'] },
  { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'phone'] },
  { model: Service, as: 'service' },
  { model: Branch, as: 'branch' },
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ============================================================
// Time Helpers (pure functions – no side effects)
// ============================================================

/** Convert "HH:MM" → total minutes */
const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** Add minutes to "HH:MM" → new "HH:MM" */
const addMinutes = (time, minutes) => {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Check if two [start, end) time ranges overlap */
const timesOverlap = (start1, end1, start2, end2) => {
  return timeToMinutes(start1) < timeToMinutes(end2)
    && timeToMinutes(start2) < timeToMinutes(end1);
};

// ============================================================
// Pagination Helper
// ============================================================

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE),
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPaginatedResponse = (rows, count, page, limit) => ({
  success: true,
  data: rows,
  meta: {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  },
});

// ============================================================
// Notification Helpers
// ============================================================

const STATUS_LABELS = {
  awaiting_deposit: 'Chờ đặt cọc',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang thực hiện',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

const notifyAppointmentCreated = async (appointment) => {
  // Notify customer
  await createNotification({
    userId: appointment.userId,
    title: 'Đặt tiền/lịch thành công',
    message: `Lịch hẹn #${appointment.id} của Quý khách vào ngày ${appointment.date}, khung giờ ${appointment.startTime} đã được tiếp nhận. Hệ thống sẽ sớm gửi xác nhận cho Quý khách.`,
    type: 'appointment',
  });

  // Notify staff if assigned
  if (appointment.staffId) {
    await createNotification({
      userId: appointment.staffId,
      title: 'Phân công phục vụ lịch hẹn',
      message: `Bạn được phân công phục vụ lịch hẹn #${appointment.id} vào ngày ${appointment.date}, lúc ${appointment.startTime}.`,
      type: 'appointment',
    });
  } else {
    // Notify admin/receptionist that a new unassigned appointment needs attention
    const { createRoleNotification } = require('./notificationController');
    await createRoleNotification('admin', {
      title: 'Lịch hẹn mới chờ phân công',
      message: `Khách hàng đã đặt lịch hẹn #${appointment.id} ngày ${appointment.date} nhưng chưa chọn thợ. Vui lòng kiểm tra.`,
      type: 'appointment',
    });
  }
};

const notifyStatusChanged = async (appointment, newStatus, cancelReason) => {
  const label = STATUS_LABELS[newStatus] || newStatus;
  let customerMessage = `Lịch hẹn #${appointment.id} ngày ${appointment.date} đã được cập nhật: ${label}.`;

  if (newStatus === 'cancelled' && cancelReason) {
    customerMessage += ` Lý do: ${cancelReason}`;
  }

  await createNotification({
    userId: appointment.userId,
    title: `Cập nhật lịch hẹn - ${label}`,
    message: customerMessage,
    type: 'appointment',
  });

  // Also notify staff
  if (appointment.staffId && appointment.staffId !== appointment.userId) {
    await createNotification({
      userId: appointment.staffId,
      title: `Cập nhật lịch hẹn - ${label}`,
      message: `Lịch hẹn #${appointment.id} ngày ${appointment.date} đã chuyển sang: ${label}.`,
      type: 'appointment',
    });
  }
};


// ============================================================
// POST / — Customer creates appointment
// ============================================================
const createAppointment = async (req, res, next) => {
  try {
    const { branchId, staffId, serviceId, date, startTime, note, phone, fullName: walkInName } = req.body;
    let userId = req.user.id;
    let isWalkIn = false;

    // --- Special Logic: Walk-in (Khách tạt vào) ---
    // If requester is staff/admin and provides phone, we handle walk-in creation
    if (['admin', 'staff', 'service_staff'].includes(req.user.role) && phone) {
      isWalkIn = true;
      
      let customer = await User.findOne({ where: { phone } });
      
      if (!customer) {
        // Create new customer account on the fly
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('123456', salt);
        const email = `${phone}@khach.salonhub.com`;
        
        customer = await User.create({
          fullName: walkInName || 'Khách vãng lai',
          phone,
          email,
          password,
          role: 'customer'
        });
      }
      userId = customer.id;
    }

    // --- Input validation ---
    if (!branchId || !serviceId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'branchId, serviceId, date, and startTime are required.',
      });
    }

    // Validate date format and ensure it's in the future
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format.',
      });
    }

    // Normalize startTime (remove SA/CH or AM/PM and trim)
    const cleanStartTime = startTime.replace(/[SA|CH|AM|PM]/gi, '').trim();
    
    // Validate time format H:M or HH:MM
    if (!/^\d{1,2}:\d{2}$/.test(cleanStartTime)) {
      return res.status(400).json({
        success: false,
        message: 'startTime must be in HH:MM format.',
      });
    }

    // Ensure 2 digits for startTime internally
    const [h, m] = cleanStartTime.split(':');
    const normalizedStartTime = `${h.padStart(2, '0')}:${m}`;

    // --- Validation: Prevent booking in the past (Timezone Aware) ---
    const now = new Date();
    const vnDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const vnTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    
    // Compare date first
    if (date < vnDate) {
      return res.status(400).json({ success: false, message: 'Không thể đặt lịch trong quá khứ.' });
    }
    
    // If today, compare time (allow 2 mins leeway)
    if (date === vnDate) {
      const currentMin = (val) => {
        const [h, m] = val.split(':').map(Number);
        return h * 60 + m;
      };
      if (currentMin(normalizedStartTime) < currentMin(vnTime) - 2) {
        return res.status(400).json({ success: false, message: 'Không thể đặt lịch trong quá khứ.' });
      }
    }

    // --- Get service to calculate endTime and price ---
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const endTime = addMinutes(normalizedStartTime, service.duration);
    const totalPrice = service.price;

    // --- If staffId provided, validate staff availability (SKIP working hours check for Walk-in) ---
    if (staffId && !phone) {
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
          message: 'Thợ không làm việc vào ngày này tại chi nhánh này.',
        });
      }

      // Check if appointment time falls within staff working hours
      if (
        timeToMinutes(normalizedStartTime) < timeToMinutes(schedule.startTime)
        || timeToMinutes(endTime) > timeToMinutes(schedule.endTime)
      ) {
        return res.status(400).json({
          success: false,
          message: `Thợ làm việc từ ${schedule.startTime} đến ${schedule.endTime} trong ngày này.`,
        });
      }

      // Check for conflicting appointments
      const existingAppointments = await Appointment.findAll({
        where: {
          staffId,
          date,
          status: { [db.Sequelize.Op.notIn]: ['cancelled'] },
        },
        attributes: ['id', 'startTime', 'endTime'],
      });

      const hasConflict = existingAppointments.some(
        (appt) => timesOverlap(normalizedStartTime, endTime, appt.startTime, appt.endTime),
      );

      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.',
        });
      }
    }

    // --- Determine initial status ---
    // Walk-in: skip deposit, go directly to in_progress
    // Normal booking: require deposit via SePay
    const initialStatus = isWalkIn ? 'in_progress' : 'awaiting_deposit';
    const depositAmount = isWalkIn ? null : parseFloat(totalPrice) * DEPOSIT_RATE;

    // --- Create appointment ---
    const appointment = await Appointment.create({
      userId,
      staffId: staffId || null,
      branchId,
      serviceId,
      date,
      startTime: normalizedStartTime,
      endTime,
      note: note || null,
      totalPrice,
      status: initialStatus,
      depositAmount,
      depositStatus: isWalkIn ? null : 'pending',
    });

    // --- For normal bookings: create pending Payment record for deposit ---
    if (!isWalkIn) {
      await Payment.create({
        appointmentId: appointment.id,
        amount: depositAmount,
        method: 'sepay',
        status: 'pending',
      });
    }

    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: APPOINTMENT_INCLUDES,
    });

    // --- Send notifications ---
    await notifyAppointmentCreated(fullAppointment);

    // --- Build response ---
    const responseData = {
      ...fullAppointment.toJSON(),
    };

    // Include deposit info for normal bookings
    if (!isWalkIn) {
      responseData.depositInfo = {
        amount: depositAmount,
        bankName: 'TPBank (Ngân hàng Tiên Phong)',
        accountNumber: '88886352274',
        accountName: 'NGUYEN NHAT MINH',
        bankId: 'TPB',
        content: `AP${appointment.id}`,
        timeoutMinutes: DEPOSIT_TIMEOUT_MINUTES,
      };
    }

    return res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /my-appointments — Customer gets own appointments
// ============================================================
const getMyAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const { rows, count } = await Appointment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service' },
        { model: Branch, as: 'branch' },
      ],
      order: [['date', 'DESC'], ['startTime', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json(
      buildPaginatedResponse(rows, count, page, limit),
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /:id — Get single appointment
// ============================================================
const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      include: APPOINTMENT_INCLUDES,
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
        message: 'Bạn không có quyền xem lịch hẹn này.',
      });
    }

    // Staff can only see own appointments
    if ((req.user.role === 'staff' || req.user.role === 'service_staff') && appointment.staffId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch hẹn của thợ khác.',
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

// ============================================================
// GET / — Admin/staff list all appointments
// ============================================================
const getAllAppointments = async (req, res, next) => {
  try {
    const { date, staffId, branchId, status } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const where = {};
    if (date) where.date = date;
    if (staffId) where.staffId = staffId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    // Security: Staff can ONLY see their own appointments
    if (req.user.role === 'staff' || req.user.role === 'service_staff') {
      where.staffId = req.user.id;
    }

    const { rows, count } = await Appointment.findAndCountAll({
      where,
      include: APPOINTMENT_INCLUDES,
      order: [['date', 'DESC'], ['startTime', 'ASC']],
      limit,
      offset,
    });

    return res.status(200).json(
      buildPaginatedResponse(rows, count, page, limit),
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /staff-appointments — Staff gets own appointments
// ============================================================
const getStaffAppointments = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const { startDate, endDate } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const where = { staffId };

    if (startDate && endDate) {
      where.date = { [db.Sequelize.Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [db.Sequelize.Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [db.Sequelize.Op.lte]: endDate };
    }

    const { rows, count } = await Appointment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Service, as: 'service' },
        { model: Branch, as: 'branch' },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
      limit,
      offset,
    });

    return res.status(200).json(
      buildPaginatedResponse(rows, count, page, limit),
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PUT /:id/status — Admin/staff update appointment status
// ============================================================
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Phải là: ${validStatuses.join(', ')}`,
      });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn.',
      });
    }

    // Validate status transition
    const allowedNextStatuses = STATUS_TRANSITIONS[appointment.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ "${STATUS_LABELS[appointment.status]}" sang "${STATUS_LABELS[status]}". Trạng thái hợp lệ tiếp theo: ${allowedNextStatuses.map((s) => STATUS_LABELS[s]).join(', ') || 'không có'}.`,
      });
    }

    const updateData = { status };
    if (status === 'cancelled' && cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    // Special logic for "completed" status
    if (status === 'completed' && appointment.status !== 'completed') {
      const transaction = await db.sequelize.transaction();
      try {
        const fullAppt = await Appointment.findByPk(id, {
          include: [{ model: Order, as: 'upsellOrder', include: [{ model: OrderItem, as: 'items' }] }],
          transaction
        });

        let totalForLoyalty = parseFloat(fullAppt.totalPrice) || 0;

        // Nếu có đơn hàng bán thêm chưa thanh toán/chưa hoàn thành
        if (fullAppt.upsellOrder && fullAppt.upsellOrder.status !== 'completed') {
          totalForLoyalty += parseFloat(fullAppt.upsellOrder.totalAmount) || 0;

          // Trừ kho cho các sản phẩm trong đơn hàng bán thêm
          for (const item of fullAppt.upsellOrder.items) {
            const product = await Product.findByPk(item.productId, { transaction });
            if (product) {
              const stockBefore = product.stock ?? product.quantity;
              const newStock = stockBefore - item.quantity;
              
              await product.update({ stock: newStock }, { transaction });

              await InventoryTransaction.create({
                productId: item.productId,
                type: 'export',
                quantity: item.quantity,
                price: item.price,
                stockBefore,
                stockAfter: newStock,
                note: `Xuất kho bán kèm theo lịch hẹn #${id}`,
                referenceType: 'appointment',
                referenceId: id,
                createdBy: req.user.id
              }, { transaction });
            }
          }

          // Cập nhật trạng thái đơn hàng
          await fullAppt.upsellOrder.update({ 
            status: 'completed', 
            paymentStatus: 'paid' 
          }, { transaction });
        }

        // Cập nhật tích điểm (1 điểm per 1000 VND)
        await updateCustomerLoyalty(fullAppt.userId, totalForLoyalty / 1000, transaction);

        // Cập nhật trạng thái lịch hẹn
        await appointment.update({ status: 'completed' }, { transaction });

        // Đồng bộ Kế toán (Tạo phiếu thu & Payment)
        await syncAppointmentAccounting(id, transaction);

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      await appointment.update(updateData);
    }

    // Tự động tạo yêu cầu hoàn tiền nếu lịch đã thanh toán (VNPay) mà bị hủy
    if (status === 'cancelled') {
        const payment = await Payment.findOne({
            where: { appointmentId: id, status: 'success' }
        });
        if (payment) {
            await RefundRequest.create({
                type: 'appointment',
                targetId: id,
                amount: payment.amount,
                reason: cancelReason || 'Hệ thống/Quản trị viên hủy lịch hẹn sau khi hoàn tất thanh toán',
                status: 'pending'
            });

            // Notify Accountant of new Refund Request
            const { createRoleNotification } = require('./notificationController');
            await createRoleNotification('accountant', {
                title: 'Yêu cầu hoàn tiền mới (Lịch hẹn)',
                message: `Lịch hẹn #${id} bị hủy sau khi thanh toán. Cần xử lý hoàn tiền: ${Math.floor(payment.amount).toLocaleString()}đ`,
                type: 'refund'
            });
        }
    }

    const updatedAppointment = await Appointment.findByPk(id, {
      include: APPOINTMENT_INCLUDES,
    });

    // Send notification
    await notifyStatusChanged(updatedAppointment, status, cancelReason);

    return res.status(200).json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PUT /:id/cancel — Customer cancels own appointment
// ============================================================
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { cancelReason } = req.body || {};

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn.',
      });
    }

    if (appointment.userId !== userId && !['admin', 'staff', 'service_staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy lịch hẹn này.',
      });
    }

    if (!['awaiting_deposit', 'pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy lịch hẹn đang chờ đặt cọc, chờ xác nhận hoặc đã xác nhận.',
      });
    }

    const updateData = { status: 'cancelled' };
    if (cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    await appointment.update(updateData);

    // Tự động yêu cầu hoàn tiền nếu lịch đã cọc/thanh toán (VNPay)
    const payment = await Payment.findOne({
        where: { appointmentId: id, status: 'success' }
    });
    if (payment) {
        await RefundRequest.create({
            type: 'appointment',
            targetId: id,
            amount: payment.amount,
            reason: cancelReason || 'Quý khách đã hủy lịch hẹn sau khi hoàn tất thanh toán',
            status: 'pending'
        });
    }

    // Send cancellation notification to staff
    await notifyStatusChanged(appointment, 'cancelled', cancelReason);

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /available-slots — Public
// ============================================================
const getAvailableSlots = async (req, res, next) => {
  try {
    const { branchId, staffId, serviceId, date } = req.query;

    if (!branchId || !staffId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'branchId, staffId, serviceId, and date are required.',
      });
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

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

    const existingAppointments = await Appointment.findAll({
      where: {
        staffId,
        date,
        status: { [db.Sequelize.Op.notIn]: ['cancelled'] },
      },
      attributes: ['startTime', 'endTime'],
      order: [['startTime', 'ASC']],
    });

    const slots = [];
    const scheduleStart = timeToMinutes(schedule.startTime);
    const scheduleEnd = timeToMinutes(schedule.endTime);

    // Calculate current time in minutes if date is today (Timezone Aware)
    const now = new Date();
    const vnDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const vnTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    const [vnH, vnM] = vnTime.split(':').map(Number);

    const isToday = date === vnDate;
    const BUFFER_MINUTES = 15; // Give Salon 15 mins to prepare
    const currentMinutes = isToday ? (vnH * 60 + vnM + BUFFER_MINUTES) : 0;

    for (let time = scheduleStart; time + service.duration <= scheduleEnd; time += SLOT_INTERVAL_MINUTES) {
      // Filter out past slots for today
      if (isToday && time < currentMinutes) continue;

      const slotStart = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
      const slotEnd = addMinutes(slotStart, service.duration);

      const hasConflict = existingAppointments.some(
        (appt) => timesOverlap(slotStart, slotEnd, appt.startTime, appt.endTime),
      );

      if (!hasConflict) {
        slots.push({ startTime: slotStart, endTime: slotEnd });
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

/**
 * Helper: Đồng bộ doanh thu sang Kế toán (CashFlow) và ghi nhận thanh toán
 * Được gọi khi lịch hẹn hoàn thành (completed)
 */
const syncAppointmentAccounting = async (appointmentId, transaction = null) => {
  const options = transaction ? { transaction } : {};
  
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      { model: Service, as: 'service' },
      { 
        model: Order, 
        as: 'upsellOrder', 
        include: [{ model: OrderItem, as: 'items' }] 
      }
    ],
    ...options
  });

  if (!appointment) return;

  const servicePrice = parseFloat(appointment.totalPrice) || 0;
  const productPrice = appointment.upsellOrder ? parseFloat(appointment.upsellOrder.totalAmount) : 0;
  const totalAmount = servicePrice + productPrice;

  if (totalAmount <= 0) return;

  // 1. Kiểm tra xem đã có bản ghi thanh toán chưa (ví dụ SePay hoặc VNPay đã tạo)
  const existingPayment = await Payment.findOne({
    where: { appointmentId: appointment.id },
    ...options
  });

  const paymentMethod = existingPayment ? existingPayment.method : 'cash';

  // 1. Tạo hoặc cập nhật bản ghi Payment (Ghi nhận đã thu tiền)
  const [payment, created] = await Payment.findOrCreate({
    where: { appointmentId: appointment.id },
    defaults: {
      amount: totalAmount,
      method: paymentMethod, // Sử dụng phương thức thực tế
      status: 'success',
      orderId: appointment.orderId || null
    },
    ...options
  });

  if (!created) {
    await payment.update({ amount: totalAmount, orderId: appointment.orderId || null, method: paymentMethod }, options);
  }

  // 2. Tạo Phiếu thu (CashFlowTransaction) cho Kế toán
  const existingTx = await CashFlowTransaction.findOne({
    where: { referenceType: 'appointment', referenceId: appointment.id },
    ...options
  });

  if (!existingTx) {
    // Map paymentMethod to DB compatible ENUM for CashFlowTransaction
    const ledgerMethod = (paymentMethod === 'sepay' || paymentMethod === 'vnpay') ? 'bank' : paymentMethod;

    await CashFlowTransaction.create({
      type: 'receipt', 
      amount: totalAmount,
      category: 'other', 
      method: ledgerMethod, // map sepay/vnpay to bank for DB compatibility
      status: 'completed',
      referenceType: 'appointment',
      referenceId: appointment.id,
      note: `Thu tiền dịch vụ: ${appointment.service?.name} + Bán lẻ - Lịch hẹn #${appointment.id}`,
      createdBy: appointment.staffId
    }, options);
  } else {
    await existingTx.update({ amount: totalAmount }, options);
  }
};

// ============================================================
// POST /:id/checkout — Unified Checkout
// ============================================================
const checkoutAppointment = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { products = [], paymentMethod = 'cod', voucherId = null } = req.body;

    const appointment = await Appointment.findByPk(id, { transaction });
    if (!appointment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Lịch hẹn không tồn tại.' });
    }

    if (appointment.status === 'completed') {
      await transaction.commit(); // Resolve gracefully since it's already done
      const fullAppt = await Appointment.findByPk(id, { include: APPOINTMENT_INCLUDES });
      return res.status(200).json({ 
        success: true, 
        message: 'Lịch hẹn đã được thanh toán và hoàn thành trước đó.',
        data: { appointment: fullAppt, totalBill: parseFloat(fullAppt.totalPrice) }
      });
    }

    let totalProductAmount = 0;
    const orderItemsData = [];

    for (const p of products) {
      const product = await Product.findByPk(p.productId, { transaction });
      if (!product || (product.stock ?? product.quantity) < p.quantity) {
        throw new Error(`Sản phẩm ${product?.name || 'không xác định'} không đủ tồn kho.`);
      }

      const price = parseFloat(product.price);
      const subtotal = price * p.quantity;
      totalProductAmount += subtotal;

      orderItemsData.push({
        productId: p.productId,
        quantity: p.quantity,
        price,
      });

      await product.update({ 
        stock: (product.stock ?? product.quantity) - p.quantity 
      }, { transaction });
    }

    let order = null;
    if (orderItemsData.length > 0) {
      order = await Order.create({
        userId: appointment.userId,
        appointmentId: appointment.id,
        totalAmount: totalProductAmount,
        paymentMethod,
        paymentStatus: 'paid',
        status: 'completed',
        voucherId,
      }, { transaction });

      for (const item of orderItemsData) {
        await OrderItem.create({
          ...item,
          orderId: order.id,
        }, { transaction });

        // Ghi lại lịch sử kho cho từng sản phẩm
        const pMod = await Product.findByPk(item.productId, { transaction });
        await InventoryTransaction.create({
          productId: item.productId,
          type: 'export',
          quantity: item.quantity,
          price: item.price,
          stockBefore: pMod.stock + item.quantity,
          stockAfter: pMod.stock,
          note: `Bán lẻ qua lịch hẹn #${appointment.id}`,
          referenceType: 'appointment',
          referenceId: appointment.id,
          createdBy: req.user.id
        }, { transaction });
      }
    }
    const servicePrice = parseFloat(appointment.totalPrice) || 0;
    const totalBill = servicePrice + totalProductAmount;

    let responseData = {
      appointment: null,
      order,
      totalBill,
    };

    if (paymentMethod === 'vnpay' || paymentMethod === 'sepay') {
      // Create pending payment record
      await Payment.create({
        appointmentId: appointment.id,
        orderId: order ? order.id : null,
        amount: totalBill,
        method: paymentMethod,
        status: 'pending',
        userId: appointment.userId
      }, { transaction });

      if (paymentMethod === 'vnpay') {
        const vnpayUrl = generateVnpayUrl({
          amount: totalBill,
          txnRef: `APP_${appointment.id}`,
          orderInfo: `Thanh toan lich hen #${appointment.id}`,
          ipAddr: req.ip || '127.0.0.1'
        });
        responseData.paymentUrl = vnpayUrl;
      }
      // For 'sepay', we just stay 'in_progress' and wait for webhook
    } else {
      // Success immediate for cash/cod
      await appointment.update({
        status: 'completed',
        orderId: order ? order.id : appointment.orderId
      }, { transaction });

      // Đồng bộ Kế toán (Tạo phiếu thu & Payment)
      await syncAppointmentAccounting(appointment.id, transaction);
      await updateCustomerLoyalty(appointment.userId, totalBill / 1000, transaction);
    }

    await transaction.commit();

    const updatedAppt = await Appointment.findByPk(id, {
      include: APPOINTMENT_INCLUDES,
    });
    responseData.appointment = updatedAppt;

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

const checkInAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Lịch hẹn không tồn tại' });
    
    if (appointment.status !== 'confirmed' && appointment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể check-in lịch đã xác nhận hoặc đang chờ' });
    }

    await appointment.update({ status: 'in_progress' });
    res.json({ success: true, message: 'Đã check-in khách!', data: appointment });
  } catch (error) { next(error); }
};

const updateUpsellItems = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { products = [] } = req.body;
    
    const appointment = await Appointment.findByPk(id, { transaction });
    if (!appointment) throw new Error('Lịch hẹn không tồn tại');

    let order;
    if (appointment.orderId) {
      order = await Order.findByPk(appointment.orderId, { transaction });
      await OrderItem.destroy({ where: { orderId: order.id }, transaction });
    } else {
      order = await Order.create({
        userId: appointment.userId,
        appointmentId: appointment.id,
        totalAmount: 0,
        paymentStatus: 'unpaid',
        status: 'pending'
      }, { transaction });
      await appointment.update({ orderId: order.id }, { transaction });
    }

    let totalAmount = 0;
    for (const p of products) {
      const product = await Product.findByPk(p.productId, { transaction });
      if (!product) continue;
      const price = parseFloat(product.price);
      totalAmount += price * p.quantity;
      
      await OrderItem.create({
        orderId: order.id,
        productId: p.productId,
        quantity: p.quantity,
        price: price
      }, { transaction });
    }

    await order.update({ totalAmount }, { transaction });
    await transaction.commit();
    
    res.json({ success: true, message: 'Đã cập nhật đơn hàng bán thêm', data: order });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

// ============================================================
// Exports
// ============================================================
module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  getAllAppointments,
  getStaffAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAvailableSlots,
  checkoutAppointment,
  checkInAppointment,
  updateUpsellItems,
  syncAppointmentAccounting
};
