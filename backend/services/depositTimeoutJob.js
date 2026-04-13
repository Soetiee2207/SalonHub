/**
 * Deposit Timeout Job
 * Auto-cancels appointments that have been in 'awaiting_deposit' status
 * for longer than the configured timeout (30 minutes).
 * Runs every 5 minutes.
 */
const { Op } = require('sequelize');
const db = require('../models');

const DEPOSIT_TIMEOUT_MINUTES = 30;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

const cancelExpiredDeposits = async () => {
  try {
    const cutoff = new Date(Date.now() - DEPOSIT_TIMEOUT_MINUTES * 60 * 1000);

    const expiredAppointments = await db.Appointment.findAll({
      where: {
        status: 'awaiting_deposit',
        depositStatus: 'pending',
        createdAt: { [Op.lt]: cutoff },
      },
    });

    if (expiredAppointments.length === 0) return;

    console.log(`[Deposit Timeout] Found ${expiredAppointments.length} expired deposit(s). Cancelling...`);

    for (const appointment of expiredAppointments) {
      await appointment.update({
        status: 'cancelled',
        cancelReason: 'Tự động hủy: Quá thời hạn đặt cọc (30 phút)',
      });

      // Cancel the pending payment record
      await db.Payment.update(
        { status: 'failed' },
        { where: { appointmentId: appointment.id, status: 'pending' } },
      );

      // Notify customer
      const { createNotification } = require('../controllers/notificationController');
      await createNotification({
        userId: appointment.userId,
        title: 'Lịch hẹn đã bị hủy',
        message: `Lịch hẹn #${appointment.id} ngày ${appointment.date} đã bị hủy do quá thời hạn đặt cọc (${DEPOSIT_TIMEOUT_MINUTES} phút).`,
        type: 'appointment',
      });

      console.log(`[Deposit Timeout] Cancelled appointment #${appointment.id}`);
    }
  } catch (error) {
    console.error('[Deposit Timeout] Error:', error.message);
  }
};

const startDepositTimeoutJob = () => {
  console.log(`⏰ Deposit timeout job started (check every ${CHECK_INTERVAL_MS / 60000} min, timeout: ${DEPOSIT_TIMEOUT_MINUTES} min)`);
  setInterval(cancelExpiredDeposits, CHECK_INTERVAL_MS);
  // Also run once immediately on startup
  cancelExpiredDeposits();
};

module.exports = { startDepositTimeoutJob, cancelExpiredDeposits };
