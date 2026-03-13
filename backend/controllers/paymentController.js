const crypto = require('crypto');
const querystring = require('qs');
const db = require('../models');
const vnpayConfig = require('../config/vnpay');

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
    const txnRef = vnpParams['vnp_TxnRef'];
    const transactionId = vnpParams['vnp_TransactionNo'];
    const amount = parseInt(vnpParams['vnp_Amount']) / 100;

    if (responseCode === '00') {
      // Payment success - find related order or appointment
      // txnRef format: orderId or appointmentId
      const order = await db.Order.findByPk(txnRef);

      if (order) {
        await order.update({ paymentStatus: 'paid' });

        // Create payment record
        await db.Payment.create({
          orderId: order.id,
          amount,
          method: 'vnpay',
          transactionId: transactionId.toString(),
          status: 'success',
          vnpayData: vnpParams,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Payment successful.',
          responseCode,
          transactionId,
          amount,
        },
      });
    } else {
      // Payment failed
      const order = await db.Order.findByPk(txnRef);

      if (order) {
        await db.Payment.create({
          orderId: order.id,
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

    const order = await db.Order.findByPk(txnRef);

    if (!order) {
      return res.status(200).json({
        RspCode: '01',
        Message: 'Order not found',
      });
    }

    // Check if amount matches
    if (parseFloat(order.totalAmount) !== amount) {
      return res.status(200).json({
        RspCode: '04',
        Message: 'Invalid amount',
      });
    }

    // Check if order already paid
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        RspCode: '02',
        Message: 'Order already confirmed',
      });
    }

    if (responseCode === '00') {
      await order.update({ paymentStatus: 'paid' });

      // Check if payment record already exists
      const existingPayment = await db.Payment.findOne({
        where: { orderId: order.id, transactionId: transactionId.toString() },
      });

      if (!existingPayment) {
        await db.Payment.create({
          orderId: order.id,
          amount,
          method: 'vnpay',
          transactionId: transactionId.toString(),
          status: 'success',
          vnpayData: vnpParams,
        });
      }

      return res.status(200).json({
        RspCode: '00',
        Message: 'Confirm success',
      });
    } else {
      return res.status(200).json({
        RspCode: '00',
        Message: 'Confirm success',
      });
    }
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

module.exports = {
  vnpayReturn,
  vnpayIPN,
  getPayments,
  getPaymentById,
  refundPayment,
};
