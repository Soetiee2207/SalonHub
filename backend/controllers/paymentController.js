const crypto = require('crypto');
const querystring = require('qs');
const db = require('../models');
const sepayConfig = require('../config/sepay');
const { syncAppointmentAccounting } = require('./appointmentController');
const { syncOrderAccounting } = require('./accountantController');
const { createNotification, createRoleNotification } = require('./notificationController');
const socketService = require('../services/socketService');

const getPayments = async (req, res, next) => {
  try {
    const payments = await db.Payment.findAll({
      include: [
        {
          model: db.Order,
          as: 'order',
          include: [
            { model: db.User, as: 'customer', attributes: { exclude: ['password'] } },
          ],
        },
        {
          model: db.Appointment,
          as: 'appointment',
          include: [
            { model: db.User, as: 'customer', attributes: { exclude: ['password'] } },
            { model: db.Service, as: 'service' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const payment = await db.Payment.findByPk(req.params.id, {
      include: [
        {
          model: db.Order,
          as: 'order',
          include: [
            { model: db.User, as: 'customer', attributes: { exclude: ['password'] } },
          ],
        },
        {
          model: db.Appointment,
          as: 'appointment',
          include: [
            { model: db.User, as: 'customer', attributes: { exclude: ['password'] } },
            { model: db.Service, as: 'service' },
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.',
      });
    }

    if (req.user.role !== 'admin') {
      const isOwner =
        (payment.order && payment.order.userId === req.user.id) ||
        (payment.appointment && payment.appointment.userId === req.user.id);

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this payment.',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const refundPayment = async (req, res, next) => {
  try {
    const payment = await db.Payment.findByPk(req.params.id, {
      include: [
        { model: db.Order, as: 'order' },
        { model: db.Appointment, as: 'appointment' },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.',
      });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been refunded.',
      });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Only successful payments can be refunded.',
      });
    }

    await payment.update({ status: 'refunded' });

    if (payment.order) {
      await payment.order.update({ paymentStatus: 'refunded' });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });

    const targetUserId = payment.order ? payment.order.userId : (payment.appointment ? payment.appointment.userId : null);
    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        title: 'Hoàn tiền thành công',
        message: `Giao dịch hoàn tiền cho ${payment.order ? 'đơn hàng' : 'lịch hẹn'} đã được xử lý.`,
        type: 'refund'
      });
    }

    await createRoleNotification('accountant', {
      title: 'Đã xử lý hoàn tiền',
      message: `Giao dịch hoàn tiền cho ${payment.order ? 'Đơn hàng #' + payment.order.id : 'Lịch hẹn'} đã được thực hiên.`,
      type: 'refund'
    });
  } catch (error) {
    next(error);
  }
};

async function calculateTotalAppAmount(appointment) {
  const upsellOrder = await db.Order.findOne({ where: { appointmentId: appointment.id } });
  const servicePrice = parseFloat(appointment.totalPrice) || 0;
  const productPrice = upsellOrder ? parseFloat(upsellOrder.totalAmount) : 0;
  return servicePrice + productPrice;
}

const sepayWebhook = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Apikey ${sepayConfig.apiKey}`) {
      return res.status(401).json({ success: false, message: 'Invalid API Key' });
    }

    const { id, code, transferAmount, transferType, nội_dung } = req.body;

    if (transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Ignoring outgoing transfer' });
    }

    let paymentCode = code || '';
    if (!paymentCode && nội_dung) {
      const extractedOrder = nội_dung.match(/SH\d+/i);
      const extractedApp = nội_dung.match(/AP\d+/i);
      paymentCode = extractedOrder ? extractedOrder[0] : (extractedApp ? extractedApp[0] : '');
    }

    if (!paymentCode) {
      return res.status(200).json({ success: true, message: 'No payment code found' });
    }

    let targetType = null;
    let targetId = null;

    const orderMatch = paymentCode.match(sepayConfig.patterns.order);
    const appointmentMatch = paymentCode.match(sepayConfig.patterns.appointment);

    if (orderMatch) {
      targetType = 'ORDER';
      targetId = orderMatch[1];
    } else if (appointmentMatch) {
      targetType = 'APP';
      targetId = appointmentMatch[1];
    } else {
      return res.status(200).json({ success: true, message: 'Code does not match any pattern' });
    }

    const t = await db.sequelize.transaction();
    try {
      if (targetType === 'ORDER') {
        const order = await db.Order.findByPk(targetId, { transaction: t });
        if (!order) {
          await t.rollback();
          return res.status(200).json({ success: true, message: 'Order not found' });
        }

        if (Math.abs(parseFloat(order.totalAmount) - parseFloat(transferAmount)) > 1) {
          await t.rollback();
          return res.status(200).json({ success: true, message: 'Amount mismatch' });
        }

        if (order.paymentStatus === 'paid') {
          await t.rollback();
          return res.status(200).json({ success: true, message: 'Order already paid' });
        }

        await order.update({ paymentStatus: 'paid', status: 'confirmed' }, { transaction: t });
        await db.Payment.upsert({
          orderId: order.id,
          amount: transferAmount,
          method: 'sepay',
          transactionId: id.toString(),
          status: 'success',
          gatewayData: req.body,
        }, { transaction: t });

      } else if (targetType === 'APP') {
        const appointment = await db.Appointment.findByPk(targetId, { transaction: t });
        if (!appointment) {
          await t.rollback();
          return res.status(200).json({ success: true, message: 'Appointment not found' });
        }

        if (appointment.status === 'awaiting_deposit') {
          const depositAmount = parseFloat(appointment.depositAmount) || 0;
          if (Math.abs(depositAmount - parseFloat(transferAmount)) > 1) {
            await t.rollback();
            return res.status(200).json({ success: true, message: 'Deposit amount mismatch' });
          }

          await appointment.update({
            status: 'pending',
            depositStatus: 'paid',
          }, { transaction: t });

          const existingPayment = await db.Payment.findOne({
            where: { appointmentId: appointment.id, method: 'sepay', status: 'pending' },
            transaction: t,
          });

          if (existingPayment) {
            await existingPayment.update({
              transactionId: id.toString(),
              status: 'success',
              gatewayData: req.body,
              isReconciled: true,
              reconciledAt: new Date(),
            }, { transaction: t });
          } else {
            await db.Payment.create({
              appointmentId: appointment.id,
              amount: transferAmount,
              method: 'sepay',
              transactionId: id.toString(),
              status: 'success',
              userId: appointment.userId,
              gatewayData: req.body,
              isReconciled: true,
              reconciledAt: new Date(),
            }, { transaction: t });
          }

          await db.CashFlowTransaction.create({
            type: 'receipt',
            amount: transferAmount,
            category: 'deposit',
            method: 'bank',
            status: 'completed',
            referenceType: 'appointment',
            referenceId: appointment.id,
            note: `Tiền đặt cọc lịch hẹn #${appointment.id}`,
            createdBy: null,
          }, { transaction: t });

        } else {
          const totalAmount = await calculateTotalAppAmount(appointment);
          if (Math.abs(totalAmount - parseFloat(transferAmount)) > 1) {
            await t.rollback();
            return res.status(200).json({ success: true, message: 'Amount mismatch for appointment' });
          }

          if (appointment.status === 'completed') {
            await t.rollback();
            return res.status(200).json({ success: true, message: 'Appointment already completed' });
          }

          await appointment.update({ status: 'completed' }, { transaction: t });
          await db.Payment.upsert({
            appointmentId: appointment.id,
            amount: transferAmount,
            method: 'sepay',
            transactionId: id.toString(),
            status: 'success',
            userId: appointment.userId,
            gatewayData: req.body,
          }, { transaction: t });

          await syncAppointmentAccounting(appointment.id, t);
          const p = await db.Payment.findOne({ where: { appointmentId: appointment.id, method: 'sepay' }, transaction: t });
          if (p) await p.update({ isReconciled: true, reconciledAt: new Date() }, { transaction: t });
        }
      }

      await t.commit();

      const targetUserId = targetType === 'ORDER' ? (await db.Order.findByPk(targetId))?.userId : (await db.Appointment.findByPk(targetId))?.userId;
      if (targetUserId) {
        await createNotification({
          userId: targetUserId,
          title: 'Thanh toán thành công',
          message: `Giao dịch chuyển khoản cho ${targetType === 'ORDER' ? 'đơn hàng' : 'lịch hẹn'} #${targetId} đã được xác nhận.`,
          type: 'payment'
        });
        
        socketService.sendToUser(targetUserId, 'payment_success', {
          type: targetType,
          id: targetId,
          message: 'Thanh toán qua SePay thành công!'
        });
      }

      if (targetType === 'ORDER') {
        await syncOrderAccounting(targetId);
      }

      return res.status(201).json({ success: true, message: 'Payment processed successfully' });

    } catch (err) {
      await t.rollback();
      throw err;
    }

  } catch (error) {
    next(error);
  }
};

module.exports = {
  sepayWebhook,
  getPayments,
  getPaymentById,
  refundPayment,
};
