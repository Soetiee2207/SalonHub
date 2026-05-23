const bcrypt = require('bcryptjs');
const db = require('../models');
const { 
  Appointment, Service, User, Branch, StaffSchedule, 
  Order, OrderItem, Product, Payment, RefundRequest,
  InventoryTransaction, CashFlowTransaction, Review 
} = db;
const { createNotification } = require('./notificationController');
const { updateCustomerLoyalty } = require('../utils/loyaltyHelper');
const socketService = require('../services/socketService');

const SLOT_INTERVAL_MINUTES = 30;

const STATUS_TRANSITIONS = {
  awaiting_deposit: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const DEPOSIT_RATE = 1.0;
const DEPOSIT_TIMEOUT_MINUTES = 30;

const APPOINTMENT_INCLUDES = [
  { model: User, as: 'customer', attributes: ['id', 'fullName', 'email', 'phone'] },
  { model: User, as: 'staff', attributes: ['id', 'fullName', 'email', 'phone'] },
  { model: Service, as: 'service' },
  { model: Branch, as: 'branch' },
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const addMinutes = (time, minutes) => {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const timesOverlap = (start1, end1, start2, end2) => {
  return timeToMinutes(start1) < timeToMinutes(end2)
    && timeToMinutes(start2) < timeToMinutes(end1);
};

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

const STATUS_LABELS = {
  awaiting_deposit: 'Chờ đặt cọc',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang thực hiện',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

const notifyAppointmentCreated = async (appointment) => {
  await createNotification({
    userId: appointment.userId,
    title: 'Khởi tạo lịch hẹn thành công',
    message: `Lịch hẹn #${appointment.id} của Quý khách vào ngày ${appointment.date}, khung giờ ${appointment.startTime} đã được hệ thống ghi nhận. Vui lòng thanh toán/đặt cọc để hoàn tất.`,
    type: 'appointment',
  });

  if (appointment.staffId) {
    await createNotification({
      userId: appointment.staffId,
      title: 'Phân công phục vụ lịch hẹn',
      message: `Bạn được phân công phục vụ lịch hẹn #${appointment.id} vào ngày ${appointment.date}, lúc ${appointment.startTime}.`,
      type: 'appointment',
    });
  } else {
    const { createRoleNotification } = require('./notificationController');
    await createRoleNotification('admin', {
      title: 'Lịch hẹn mới chờ phân công',
      message: `Khách hàng đã đặt lịch hẹn #${appointment.id} ngày ${appointment.date}.`,
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

  if (appointment.staffId && appointment.staffId !== appointment.userId) {
    await createNotification({
      userId: appointment.staffId,
      title: `Cập nhật lịch hẹn - ${label}`,
      message: `Lịch hẹn #${appointment.id} ngày ${appointment.date} đã chuyển sang: ${label}.`,
      type: 'appointment',
    });
  }
};

const createAppointment = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { branchId, staffId, serviceId, date, startTime, note, phone, fullName: walkInName, voucherCode } = req.body;
    let userId = req.user.id;
    let isWalkIn = false;

    if (['admin', 'staff', 'service_staff'].includes(req.user.role) && phone) {
      isWalkIn = true;
      let customer = await User.findOne({ where: { phone }, transaction });
      
      if (!customer) {
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('123456', salt);
        const email = `${phone}@khach.salonhub.com`;
        
        customer = await User.create({
          fullName: walkInName || 'Khách vãng lai',
          phone,
          email,
          password,
          role: 'customer'
        }, { transaction });
      }
      userId = customer.id;
    }

    if (!branchId || !serviceId || !date || !startTime) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'branchId, serviceId, date, and startTime are required.' });
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Invalid date format.' });
    }

    const cleanStartTime = startTime.replace(/[SA|CH|AM|PM]/gi, '').trim();
    if (!/^\d{1,2}:\d{2}$/.test(cleanStartTime)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'startTime must be in HH:MM format.' });
    }

    const [h, m] = cleanStartTime.split(':');
    const normalizedStartTime = `${h.padStart(2, '0')}:${m}`;

    const now = new Date();
    const vnDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const vnTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    
    if (date < vnDate) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Không thể đặt lịch trong quá khứ.' });
    }
    
    if (date === vnDate) {
      const currentMin = (val) => {
        const [h, m] = val.split(':').map(Number);
        return h * 60 + m;
      };
      if (currentMin(normalizedStartTime) < currentMin(vnTime) - 2) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Không thể đặt lịch trong quá khứ.' });
      }
    }

    const service = await Service.findByPk(serviceId, { transaction });
    if (!service) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const endTime = addMinutes(normalizedStartTime, service.duration);
    let totalPrice = parseFloat(service.price);
    let appliedVoucherCode = null;
    let appliedDiscountAmount = 0;

    if (voucherCode && !isWalkIn) {
      const voucher = await Voucher.findOne({
        where: { code: voucherCode.toUpperCase(), isActive: true },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (voucher) {
        const todayStr = now.toISOString().split('T')[0];
        if (voucher.startDate <= todayStr && voucher.endDate >= todayStr) {
          if (voucher.usageLimit === null || voucher.usedCount < voucher.usageLimit) {
            if (totalPrice >= parseFloat(voucher.minOrderValue)) {
              if (voucher.discountType === 'percent') {
                appliedDiscountAmount = (totalPrice * parseFloat(voucher.discount)) / 100;
                if (voucher.maxDiscount && appliedDiscountAmount > parseFloat(voucher.maxDiscount)) {
                  appliedDiscountAmount = parseFloat(voucher.maxDiscount);
                }
              } else {
                appliedDiscountAmount = parseFloat(voucher.discount);
              }
              
              if (appliedDiscountAmount > totalPrice) {
                appliedDiscountAmount = totalPrice;
              }

              totalPrice -= appliedDiscountAmount;
              appliedVoucherCode = voucher.code;

              await voucher.increment('usedCount', { by: 1, transaction });
            }
          }
        }
      }
    }

    if (staffId && !phone) {
      const dayOfWeek = appointmentDate.getDay();
      const schedule = await StaffSchedule.findOne({
        where: { userId: staffId, branchId, dayOfWeek },
        transaction
      });

      if (!schedule) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Thợ không làm việc vào ngày này tại chi nhánh này.' });
      }

      if (timeToMinutes(normalizedStartTime) < timeToMinutes(schedule.startTime) || 
          timeToMinutes(endTime) > timeToMinutes(schedule.endTime)) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: `Thợ làm việc từ ${schedule.startTime} đến ${schedule.endTime}.` });
      }

      const existingAppointments = await Appointment.findAll({
        where: {
          staffId,
          date,
          status: { [db.Sequelize.Op.notIn]: ['cancelled'] },
        },
        attributes: ['id', 'startTime', 'endTime'],
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      const hasConflict = existingAppointments.some(
        (appt) => timesOverlap(normalizedStartTime, endTime, appt.startTime, appt.endTime),
      );

      if (hasConflict) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Khung giờ này đã có người đặt.' });
      }
    }

    const initialStatus = isWalkIn ? 'in_progress' : 'awaiting_deposit';
    const depositAmount = isWalkIn ? null : parseFloat(totalPrice) * DEPOSIT_RATE;

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
    }, { transaction });

    if (!isWalkIn) {
      await Payment.create({
        appointmentId: appointment.id,
        amount: depositAmount,
        method: 'sepay',
        status: 'pending',
      }, { transaction });
    }

    await transaction.commit();

    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: APPOINTMENT_INCLUDES,
    });

    await notifyAppointmentCreated(fullAppointment);
    socketService.broadcast('new_appointment', fullAppointment);

    const responseData = { ...fullAppointment.toJSON() };
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

    return res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

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

    const reviewedAppointments = await Review.findAll({
      where: { userId },
      attributes: ['appointmentId'],
      raw: true,
    });
    const reviewedSet = new Set(reviewedAppointments.map(r => r.appointmentId));

    const data = rows.map(row => ({
      ...row.toJSON(),
      reviewed: reviewedSet.has(row.id),
    }));

    return res.status(200).json(
      buildPaginatedResponse(data, count, page, limit),
    );
  } catch (error) {
    next(error);
  }
};

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

    if (req.user.role === 'customer' && appointment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch hẹn này.',
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

const getAllAppointments = async (req, res, next) => {
  try {
    const { date, staffId, branchId, status } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const where = {};
    if (date) where.date = date;
    if (staffId) where.staffId = staffId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

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

const getStaffAppointments = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const { startDate, endDate } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const where = { staffId };

    if (startDate && endDate) {
      where.date = { [db.Sequelize.Op.between]: [startDate, endDate] };
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

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ.',
      });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn.',
      });
    }

    const allowedNextStatuses = STATUS_TRANSITIONS[appointment.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Chuyển trạng thái không hợp lệ.`,
      });
    }

    const updateData = { status };
    if (status === 'cancelled' && cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    if (status === 'completed' && appointment.status !== 'completed') {
      const transaction = await db.sequelize.transaction();
      try {
        const fullAppt = await Appointment.findByPk(id, {
          include: [{ model: Order, as: 'upsellOrder', include: [{ model: OrderItem, as: 'items' }] }],
          transaction
        });

        let totalForLoyalty = parseFloat(fullAppt.totalPrice) || 0;

        if (fullAppt.upsellOrder && fullAppt.upsellOrder.status !== 'completed') {
          totalForLoyalty += parseFloat(fullAppt.upsellOrder.totalAmount) || 0;

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
                note: `Xuất kho bán kèm lịch hẹn #${id}`,
                referenceType: 'appointment',
                referenceId: id,
                createdBy: req.user.id
              }, { transaction });
            }
          }

          await fullAppt.upsellOrder.update({ 
            status: 'completed', 
            paymentStatus: 'paid' 
          }, { transaction });
        }

        await updateCustomerLoyalty(fullAppt.userId, totalForLoyalty / 1000, transaction);
        await appointment.update({ status: 'completed' }, { transaction });
        await syncAppointmentAccounting(id, transaction);
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      await appointment.update(updateData);
    }

    if (status === 'cancelled') {
        const payment = await Payment.findOne({
            where: { appointmentId: id, status: 'success' }
        });
        if (payment) {
            await RefundRequest.create({
                type: 'appointment',
                targetId: id,
                amount: payment.amount,
                reason: cancelReason || 'Hủy lịch hẹn sau khi thanh toán',
                status: 'pending'
            });
        }
    }

    const updatedAppointment = await Appointment.findByPk(id, {
      include: APPOINTMENT_INCLUDES,
    });

    await notifyStatusChanged(updatedAppointment, status, cancelReason);
    socketService.broadcast('appointment_updated', updatedAppointment);

    return res.status(200).json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { cancelReason } = req.body || {};

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    }

    if (appointment.userId !== userId && !['admin', 'staff', 'service_staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy lịch hẹn này.' });
    }

    if (!['awaiting_deposit', 'pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Không thể hủy lịch hẹn ở trạng thái này.' });
    }

    await appointment.update({ status: 'cancelled', cancelReason: cancelReason || null });

    const payment = await Payment.findOne({ where: { appointmentId: id, status: 'success' } });
    if (payment) {
        await RefundRequest.create({
            type: 'appointment',
            targetId: id,
            amount: payment.amount,
            reason: cancelReason || 'Khách hàng hủy lịch hẹn sau khi thanh toán',
            status: 'pending'
        });
    }

    await notifyStatusChanged(appointment, 'cancelled', cancelReason);
    socketService.broadcast('appointment_updated', { id: appointment.id, status: 'cancelled' });

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { branchId, staffId, serviceId, date } = req.query;

    if (!branchId || !staffId || !serviceId || !date) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin.' });
    }

    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ success: false, message: 'Dịch vụ không tồn tại.' });

    const dayOfWeek = new Date(date).getDay();
    const schedule = await StaffSchedule.findOne({ where: { userId: staffId, branchId, dayOfWeek } });

    if (!schedule) return res.status(200).json({ success: true, data: [] });

    const existingAppointments = await Appointment.findAll({
      where: { staffId, date, status: { [db.Sequelize.Op.notIn]: ['cancelled'] } },
      attributes: ['startTime', 'endTime'],
      order: [['startTime', 'ASC']],
    });

    const slots = [];
    const scheduleStart = timeToMinutes(schedule.startTime);
    const scheduleEnd = timeToMinutes(schedule.endTime);

    const now = new Date();
    const vnDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const vnTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    const [vnH, vnM] = vnTime.split(':').map(Number);

    const isToday = date === vnDate;
    const currentMinutes = isToday ? (vnH * 60 + vnM + 15) : 0;

    for (let time = scheduleStart; time + service.duration <= scheduleEnd; time += SLOT_INTERVAL_MINUTES) {
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

    return res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

const syncAppointmentAccounting = async (appointmentId, transaction = null) => {
  const options = transaction ? { transaction } : {};
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [{ model: Service, as: 'service' }, { model: Order, as: 'upsellOrder' }],
    ...options
  });

  if (!appointment) return;

  const totalAmount = (parseFloat(appointment.totalPrice) || 0) + (appointment.upsellOrder ? parseFloat(appointment.upsellOrder.totalAmount) : 0);
  if (totalAmount <= 0) return;

  const existingPayment = await Payment.findOne({ where: { appointmentId: appointment.id }, ...options });
  const paymentMethod = existingPayment ? existingPayment.method : 'cash';
  const isCashOrCod = paymentMethod === 'cash' || paymentMethod === 'cod';

  const [payment, created] = await Payment.findOrCreate({
    where: { appointmentId: appointment.id },
    defaults: {
      amount: totalAmount,
      method: paymentMethod,
      status: isCashOrCod ? 'pending' : 'success',
      isReconciled: !isCashOrCod
    },
    ...options
  });

  if (!created) {
    await payment.update({ 
      amount: totalAmount, 
      method: paymentMethod,
      status: isCashOrCod ? 'pending' : payment.status,
      isReconciled: isCashOrCod ? false : payment.isReconciled
    }, options);
  }

  if (!isCashOrCod) {
    const existingTx = await CashFlowTransaction.findOne({
      where: { referenceType: 'appointment', referenceId: appointment.id },
      ...options
    });

    if (!existingTx) {
      const ledgerMethod = (paymentMethod === 'sepay') ? 'bank' : paymentMethod;
      await CashFlowTransaction.create({
        type: 'receipt', 
        amount: totalAmount,
        category: 'other', 
        method: ledgerMethod,
        status: 'completed',
        referenceType: 'appointment',
        referenceId: appointment.id,
        note: `Thu tiền dịch vụ lịch hẹn #${appointment.id}`,
        createdBy: appointment.staffId || 1
      }, options);
    } else {
      await existingTx.update({ amount: totalAmount }, options);
    }
  }
};

const checkoutAppointment = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { products = [], paymentMethod = 'cod', voucherId = null } = req.body;

    const appointment = await Appointment.findByPk(id, { transaction });
    if (!appointment) throw new Error('Lịch hẹn không tồn tại.');

    if (appointment.status === 'completed') {
      await transaction.commit();
      const fullAppt = await Appointment.findByPk(id, { include: APPOINTMENT_INCLUDES });
      return res.status(200).json({ 
        success: true, 
        message: 'Lịch hẹn đã được hoàn thành trước đó.',
        data: { appointment: fullAppt, totalBill: parseFloat(fullAppt.totalPrice) }
      });
    }

    let totalProductAmount = 0;
    const orderItemsData = [];

    for (const p of products) {
      const product = await Product.findByPk(p.productId, { transaction });
      if (!product || (product.stock ?? product.quantity) < p.quantity) {
        throw new Error(`Sản phẩm không đủ tồn kho.`);
      }

      const price = parseFloat(product.price);
      totalProductAmount += price * p.quantity;
      orderItemsData.push({ productId: p.productId, quantity: p.quantity, price });

      await product.update({ stock: (product.stock ?? product.quantity) - p.quantity }, { transaction });
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
        await OrderItem.create({ ...item, orderId: order.id }, { transaction });
      }
    }
    const totalBill = (parseFloat(appointment.totalPrice) || 0) + totalProductAmount;

    let responseData = { appointment: null, order, totalBill };

    if (paymentMethod === 'sepay') {
      await Payment.create({
        appointmentId: appointment.id,
        orderId: order ? order.id : null,
        amount: totalBill,
        method: paymentMethod,
        status: 'pending',
        userId: appointment.userId
      }, { transaction });
    } else {
      await appointment.update({ status: 'completed', orderId: order ? order.id : appointment.orderId }, { transaction });
      await syncAppointmentAccounting(appointment.id, transaction);
      await updateCustomerLoyalty(appointment.userId, totalBill / 1000, transaction);
    }

    await transaction.commit();
    const updatedAppt = await Appointment.findByPk(id, { include: APPOINTMENT_INCLUDES });
    socketService.broadcast('appointment_updated', updatedAppt);
    responseData.appointment = updatedAppt;

    return res.status(200).json({ success: true, data: responseData });
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
      order = await Order.create({ userId: appointment.userId, appointmentId: appointment.id, totalAmount: 0, paymentStatus: 'unpaid', status: 'pending' }, { transaction });
      await appointment.update({ orderId: order.id }, { transaction });
    }

    let totalAmount = 0;
    for (const p of products) {
      const product = await Product.findByPk(p.productId, { transaction });
      if (!product) continue;
      const price = parseFloat(product.price);
      totalAmount += price * p.quantity;
      await OrderItem.create({ orderId: order.id, productId: p.productId, quantity: p.quantity, price }, { transaction });
    }

    await order.update({ totalAmount }, { transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Đã cập nhật đơn hàng bán thêm', data: order });
  } catch (error) {
    if (transaction) await transaction.rollback();
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
  checkoutAppointment,
  checkInAppointment,
  updateUpsellItems,
  syncAppointmentAccounting
};
