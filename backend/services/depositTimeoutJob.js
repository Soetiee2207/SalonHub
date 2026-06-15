/**
 * Deposit & Payment Timeout Job
 * 
 * 1. Auto-cancels appointments in 'awaiting_deposit' for > 2 minutes.
 * 2. Auto-cancels orders with SePay payment still 'pending' for > 2 minutes.
 * 
 * Runs every 30 seconds to ensure timely cancellation.
 */
const { Op } = require('sequelize');
const db = require('../models');

const PAYMENT_TIMEOUT_MINUTES = 2;
const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

// ---- 1. Cancel expired appointment deposits ----
const cancelExpiredDeposits = async () => {
  try {
    const cutoff = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

    const expiredAppointments = await db.Appointment.findAll({
      where: {
        status: 'awaiting_deposit',
        depositStatus: 'pending',
        createdAt: { [Op.lt]: cutoff },
      },
    });

    if (expiredAppointments.length === 0) return;

    console.log(`[Payment Timeout] Found ${expiredAppointments.length} expired appointment deposit(s). Cancelling...`);

    for (const appointment of expiredAppointments) {
      await appointment.update({
        status: 'cancelled',
        cancelReason: `Tự động hủy: Quá thời hạn đặt cọc (${PAYMENT_TIMEOUT_MINUTES} phút)`,
      });

      await db.Payment.update(
        { status: 'failed' },
        { where: { appointmentId: appointment.id, status: 'pending' } },
      );

      const { createNotification } = require('../controllers/notificationController');
      await createNotification({
        userId: appointment.userId,
        title: 'Lịch hẹn đã bị hủy',
        message: `Lịch hẹn #${appointment.id} ngày ${appointment.date} đã bị hủy do quá thời hạn đặt cọc (${PAYMENT_TIMEOUT_MINUTES} phút).`,
        type: 'appointment',
      });

      console.log(`[Payment Timeout] Cancelled appointment #${appointment.id}`);
    }
  } catch (error) {
    console.error('[Payment Timeout] Error cancelling expired deposits:', error.message);
  }
};

// ---- 2. Cancel expired SePay orders ----
const cancelExpiredOrders = async () => {
  try {
    const cutoff = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

    const expiredOrders = await db.Order.findAll({
      where: {
        paymentMethod: 'sepay',
        paymentStatus: 'pending',
        status: 'pending',
        createdAt: { [Op.lt]: cutoff },
      },
      include: [{ model: db.OrderItem, as: 'items' }],
    });

    if (expiredOrders.length === 0) return;

    console.log(`[Payment Timeout] Found ${expiredOrders.length} expired SePay order(s). Cancelling...`);

    for (const order of expiredOrders) {
      const t = await db.sequelize.transaction();
      try {
        // Restore reserved stock for each product
        for (const item of order.items) {
          const product = await db.Product.findByPk(item.productId, { transaction: t });
          if (product) {
            await product.update({
              reservedStock: Math.max(0, product.reservedStock - item.quantity),
            }, { transaction: t });
          }
        }

        await order.update({ status: 'cancelled' }, { transaction: t });

        await db.Payment.update(
          { status: 'failed' },
          { where: { orderId: order.id, status: 'pending' }, transaction: t },
        );

        await t.commit();

        const { createNotification } = require('../controllers/notificationController');
        await createNotification({
          userId: order.userId,
          title: 'Đơn hàng đã bị hủy',
          message: `Đơn hàng #${order.id} đã bị hủy do quá thời hạn thanh toán (${PAYMENT_TIMEOUT_MINUTES} phút).`,
          type: 'order',
        });

        console.log(`[Payment Timeout] Cancelled order #${order.id}`);
      } catch (err) {
        await t.rollback();
        console.error(`[Payment Timeout] Error cancelling order #${order.id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Payment Timeout] Error cancelling expired orders:', error.message);
  }
};

// ---- Combined runner ----
const runTimeoutChecks = async () => {
  await cancelExpiredDeposits();
  await cancelExpiredOrders();
};

const startDepositTimeoutJob = () => {
  console.log(`⏰ Payment timeout job started (check every ${CHECK_INTERVAL_MS / 1000}s, timeout: ${PAYMENT_TIMEOUT_MINUTES} min)`);
  setInterval(runTimeoutChecks, CHECK_INTERVAL_MS);
  // Run immediately on startup
  runTimeoutChecks();
};

module.exports = { startDepositTimeoutJob, cancelExpiredDeposits, cancelExpiredOrders };
