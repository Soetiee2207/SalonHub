const crypto = require('crypto');
const querystring = require('qs');
const db = require('../models');
const vnpayConfig = require('../config/vnpay');
const sepayConfig = require('../config/sepay');
const { syncAppointmentAccounting } = require('./appointmentController');
const { syncOrderAccounting, syncTransactionToCashFlow } = require('./accountantController');
const { createNotification, createRoleNotification } = require('./notificationController');
const socketService = require('../services/socketService');

// VNPay return handler
const vnpayReturn = async (req, res, next) => {
  try {
    let vnpParams = req.query;

    const secureHash = vnpParams['vnp_SecureHash'];

    // Remove hash fields before verification
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort params
    vnpParams = sortObject(vnpParams);

    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature.',
      });
    }

    const responseCode = vnpParams['vnp_ResponseCode'];
    const txnRef = vnpParams['vnp_TxnRef']; // Format: ORDER_123 or APP_456
    const transactionId = vnpParams['vnp_TransactionNo'];
    const amount = parseInt(vnpParams['vnp_Amount']) / 100;

    const [refType, refId] = txnRef.split('_');

    if (responseCode === '00') {
      if (refType === 'ORDER') {
        const order = await db.Order.findByPk(refId);
        if (order) {
          await order.update({ paymentStatus: 'paid' });
          await db.Payment.upsert({
            orderId: order.id,
            amount,
            method: 'vnpay',
            transactionId: transactionId.toString(),
            status: 'success',
            vnpayData: vnpParams,
          });
          // Tự động hạch toán cho ORDER
          await syncOrderAccounting(order.id);
        }
      } else if (refType === 'APP') {
        const appointment = await db.Appointment.findByPk(refId);
        if (appointment) {
          await appointment.update({ status: 'completed' });
          await db.Payment.upsert({
            appointmentId: appointment.id,
            amount,
            method: 'vnpay',
            transactionId: transactionId.toString(),
            status: 'success',
            vnpayData: vnpParams,
            userId: appointment.userId
          });
          // Sync accounting for appointment
          await syncAppointmentAccounting(appointment.id);
        }
      }

      // --- REAL-TIME NOTIFICATIONS ---
      // 1. Notify Accountant
      await createRoleNotification('accountant', {
        title: 'Thanh toán trực tuyến thành công',
        message: `Giao dịch VNPay mới cho ${refType} #${refId} trị giá ${amount.toLocaleString()}đ đã được xác nhận.`,
        type: 'payment'
      });

      // 2. Notify Customer
      const targetUserId = refType === 'ORDER' ? (await db.Order.findByPk(refId))?.userId : (await db.Appointment.findByPk(refId))?.userId;
      if (targetUserId) {
        await createNotification({
          userId: targetUserId,
          title: 'Thanh toán thành công',
          message: `Giao dịch cho ${refType === 'ORDER' ? 'đơn hàng' : 'lịch hẹn'} #${refId} đã được xác nhận. Cảm ơn quý khách!`,
          type: 'payment'
        });
      }

      // 3. Emit Socket event for instant redirect
      if (targetUserId) {
        socketService.sendToUser(targetUserId, 'payment_success', {
          type: refType,
          id: refId,
          message: 'Thanh toán thành công!'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Payment successful.',
          responseCode,
          transactionId,
          amount,
          type: refType
        },
      });
    } else {
      // Payment failed
      if (refType === 'ORDER') {
        await db.Payment.create({
          orderId: refId,
          amount,
          method: 'vnpay',
          transactionId: transactionId ? transactionId.toString() : null,
          status: 'failed',
          vnpayData: vnpParams,
        });
      } else if (refType === 'APP') {
        await db.Payment.create({
          appointmentId: refId,
          amount,
          method: 'vnpay',
          transactionId: transactionId ? transactionId.toString() : null,
          status: 'failed',
          vnpayData: vnpParams,
        });
      }

      return res.status(200).json({
        success: false,
        data: {
          message: 'Payment failed.',
          responseCode,
          type: refType
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// VNPay IPN handler
const vnpayIPN = async (req, res, next) => {
  try {
    let vnpParams = req.query;

    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    vnpParams = sortObject(vnpParams);

    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.status(200).json({
        RspCode: '97',
        Message: 'Invalid signature',
      });
    }

    const responseCode = vnpParams['vnp_ResponseCode'];
    const txnRef = vnpParams['vnp_TxnRef'];
    const transactionId = vnpParams['vnp_TransactionNo'];
    const amount = parseInt(vnpParams['vnp_Amount']) / 100;

    const [refType, refId] = txnRef.split('_');

    if (refType === 'ORDER') {
      const order = await db.Order.findByPk(refId);
      if (!order) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      if (parseFloat(order.totalAmount) !== amount) return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
      if (order.paymentStatus === 'paid') return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });

      if (responseCode === '00') {
        await order.update({ paymentStatus: 'paid' });
        await db.Payment.upsert({
          orderId: order.id,
          amount,
          method: 'vnpay',
          transactionId: transactionId.toString(),
          status: 'success',
          vnpayData: vnpParams,
        });
        // Tự động hạch toán cho ORDER
        await syncOrderAccounting(order.id);
      }
    } else if (refType === 'APP') {
      const appointment = await db.Appointment.findByPk(refId);
      if (!appointment) return res.status(200).json({ RspCode: '01', Message: 'Appointment not found' });
      if (parseFloat(appointment.totalPrice) !== amount) {
        // Might include upsell order
        const total = await calculateTotalAppAmount(appointment);
        if (total !== amount) return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
      }
      if (appointment.status === 'completed') return res.status(200).json({ RspCode: '02', Message: 'Already confirmed' });

      if (responseCode === '00') {
        await appointment.update({ status: 'completed' });
        await db.Payment.upsert({
          appointmentId: appointment.id,
          amount,
          method: 'vnpay',
          transactionId: transactionId.toString(),
          status: 'success',
          vnpayData: vnpParams,
          userId: appointment.userId
        });
        await syncAppointmentAccounting(appointment.id);
      }
      
      // Emit Socket success for IPN as well (catch-all)
      const targetUserId = refType === 'ORDER' ? (await db.Order.findByPk(refId))?.userId : (await db.Appointment.findByPk(refId))?.userId;
      if (targetUserId) {
        socketService.sendToUser(targetUserId, 'payment_success', {
          type: refType,
          id: refId
        });
      }
    }

    return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
  } catch (error) {
    return res.status(200).json({
      RspCode: '99',
      Message: 'Unknown error',
    });
  }
};

// Get all payments (admin only)
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

// Get payment by ID (admin or owner)
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

    // Check ownership if not admin
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

// Refund payment (admin only)
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

    // Update order or appointment payment status
    if (payment.order) {
      await payment.order.update({ paymentStatus: 'refunded' });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });

    // --- REAL-TIME NOTIFICATIONS ---
    const targetUserId = payment.order ? payment.order.userId : (payment.appointment ? payment.appointment.userId : null);
    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        title: 'Hoàn tiền thành công',
        message: `Giao dịch hoàn tiền cho ${payment.order ? 'đơn hàng' : 'lịch hẹn'} đã được xử lý. Vui lòng kiểm tra tài khoản của quý khách.`,
        type: 'refund'
      });
    }

    await createRoleNotification('accountant', {
      title: 'Đã xử lý hoàn tiền',
      message: `Giao dịch hoàn tiền cho ${payment.order ? 'Đơn hàng #' + payment.order.id : 'Lịch hẹn'} đã được thực hiên bởi ${req.user.fullName}.`,
      type: 'refund'
    });
  } catch (error) {
    next(error);
  }
};

// Helper: sort object keys alphabetically
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  }
  return sorted;
}

// Helper: Calculate total amount for appointment (service + upsell order)
async function calculateTotalAppAmount(appointment) {
  const upsellOrder = await db.Order.findOne({ where: { appointmentId: appointment.id } });
  const servicePrice = parseFloat(appointment.totalPrice) || 0;
  const productPrice = upsellOrder ? parseFloat(upsellOrder.totalAmount) : 0;
  return servicePrice + productPrice;
}

// SePay Webhook handler
const sepayWebhook = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log(`[SePay Webhook] Incoming request from IP: ${clientIp}`);
    console.log(`[SePay Webhook] Auth Header: ${authHeader}`);
    console.log(`[SePay Webhook] Configured Key: ${sepayConfig.apiKey.substring(0, 10)}...`);

    // 1. Authenticate with API Key
    if (!authHeader || authHeader !== `Apikey ${sepayConfig.apiKey}`) {
      console.warn(`[SePay Webhook] Unauthorized: Auth Header mismatch.`);
      return res.status(401).json({ success: false, message: 'Invalid API Key' });
    }

    const { id, code, transferAmount, transferType, transferDate, nội_dung } = req.body;
    console.log(`[SePay Webhook] Transaction Details: ID=${id}, Code=${code}, Amount=${transferAmount}, Content=${nội_dung}`);

    // 2. IP Whitelist Check (Optional but recommended)
    // if (!sepayConfig.ipWhitelist.includes(clientIp)) {
    //   console.warn(`[SePay] Untrusted IP: ${clientIp}`);
    //   return res.status(401).json({ success: false, message: 'Untrusted IP source' });
    // }


    // Only process incoming transfers
    if (transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Ignoring outgoing transfer' });
    }

    if (!code) {
      return res.status(200).json({ success: true, message: 'No payment code found' });
    }

    // 3. Match Order or Appointment
    let targetType = null;
    let targetId = null;

    const orderMatch = code.match(sepayConfig.patterns.order);
    const appointmentMatch = code.match(sepayConfig.patterns.appointment);

    if (orderMatch) {
      targetType = 'ORDER';
      targetId = orderMatch[1];
    } else if (appointmentMatch) {
      targetType = 'APP';
      targetId = appointmentMatch[1];
    } else {
      console.warn(`[SePay Webhook] No match for code: ${code}`);
      return res.status(200).json({ success: true, message: 'Code does not match any pattern' });
    }

    console.log(`[SePay Webhook] Matched Target: ${targetType} #${targetId}`);

    const t = await db.sequelize.transaction();
    try {
      if (targetType === 'ORDER') {
        const order = await db.Order.findByPk(targetId, { transaction: t });
        if (!order) {
          console.error(`[SePay Webhook] ORDER #${targetId} not found in Database.`);
          await t.rollback();
          return res.status(200).json({ success: true, message: 'Order not found' });
        }
        console.log(`[SePay Webhook] Found Order #${order.id}, Status: ${order.paymentStatus}`);

        // Allow some tolerance in amount comparison if needed, but SePay sends raw bank numbers
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
          vnpayData: req.body, // Reusing field for convenience
        }, { transaction: t });

        // Tự động hạch toán cho ORDER (bỏ qua đối soát)
        // We'll call this after commit to use standard helper or wrap it
      } else if (targetType === 'APP') {
        const appointment = await db.Appointment.findByPk(targetId, { transaction: t });
        if (!appointment) {
          await t.rollback();
          return res.status(200).json({ success: true, message: 'Appointment not found' });
        }

        // Match total price (including upsell order if any)
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
          vnpayData: req.body,
        }, { transaction: t });

        await syncAppointmentAccounting(appointment.id, t);
        // Tự động hạch toán bỏ qua đối soát (isReconciled=true)
        // Note: appointment payments are already synced to accounting via syncAppointmentAccounting, 
        // but we want to mark them as reconciled if they are from automated gateways
        const p = await db.Payment.findOne({ where: { appointmentId: appointment.id, method: 'sepay' }, transaction: t });
        if (p) await p.update({ isReconciled: true, reconciledAt: new Date() }, { transaction: t });
        
      } else if (targetType === 'ORDER') {
         // Hanlde Order accounting sync already handled below or inside if
      }

      await t.commit();

      // --- REAL-TIME NOTIFICATIONS ---
      await createRoleNotification('accountant', {
        title: 'Thanh toán chuyển khoản thành công (SePay)',
        message: `Giao dịch ${targetType} #${targetId} trị giá ${parseFloat(transferAmount).toLocaleString()}đ đã được tự động xác nhận qua SePay.`,
        type: 'payment'
      });

      const targetUserId = targetType === 'ORDER' ? (await db.Order.findByPk(targetId))?.userId : (await db.Appointment.findByPk(targetId))?.userId;
      if (targetUserId) {
        await createNotification({
          userId: targetUserId,
          title: 'Thanh toán thành công',
          message: `Giao dịch chuyển khoản cho ${targetType === 'ORDER' ? 'đơn hàng' : 'lịch hẹn'} #${targetId} đã được xác nhận. Cảm ơn quý khách!`,
          type: 'payment'
        });
      }

      // Hạch toán tự động sau khi commit thành công
      if (targetType === 'ORDER') {
        await syncOrderAccounting(targetId);
      }

      // 3. Emit Socket event for instant redirect
      if (targetUserId) {
        socketService.sendToUser(targetUserId, 'payment_success', {
          type: targetType,
          id: targetId,
          message: 'Thanh toán qua SePay thành công!'
        });
      }

      console.log(`[SePay Webhook] Successfully processed ${targetType} #${targetId}`);
      return res.status(201).json({ success: true, message: 'Payment processed successfully' });

    } catch (err) {
      await t.rollback();
      throw err;
    }

  } catch (error) {
    console.error('[SePay Webhook Error]:', error);
    next(error);
  }
};

module.exports = {
  vnpayReturn,
  vnpayIPN,
  sepayWebhook,
  getPayments,
  getPaymentById,
  refundPayment,
};
