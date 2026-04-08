const { Op } = require('sequelize');
const db = require('../models');
const { 
  CashFlowTransaction, 
  RefundRequest, 
  Payment, 
  Order, 
  OrderItem, 
  Appointment, 
  User, 
  Product, 
  ProductBatch, 
  sequelize 
} = db;
const { createNotification } = require('./notificationController');

// ============================================================
// GET /api/accountant/stats
// Thống kê tài chính dành cho Accountant Dashboard
// ============================================================
const getFinancialStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    // 1. Tổng thu từ hệ thống (Payments Success)
    const totalPayments = await Payment.findAll({
      where: { 
        status: 'success',
        ...dateFilter
      },
      attributes: [
        'method',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
      ],
      group: ['method'],
      raw: true,
    });

    // 2. Thu nhập Dịch vụ vs Bán lẻ
    // Thu nhập dịch vụ (từ Appointments)
    const serviceRevenue = await Payment.sum('amount', {
      where: { 
        appointmentId: { [Op.ne]: null },
        status: 'success',
        ...dateFilter
      }
    }) || 0;

    // Thu nhập bán lẻ (từ Orders)
    const retailRevenue = await Payment.sum('amount', {
      where: { 
        orderId: { [Op.ne]: null },
        status: 'success',
        ...dateFilter
      }
    }) || 0;

    // 3. Chi phí vận hành (từ CashFlowTransaction type='payment')
    const totalExpenses = await CashFlowTransaction.sum('amount', {
      where: { 
        type: 'payment',
        status: 'completed',
        ...dateFilter
      }
    }) || 0;

    // 4. Giá vốn hàng bán (COGS - Cost of Goods Sold)
    const ordersWithPayments = await Payment.findAll({
        where: { orderId: { [Op.ne]: null }, status: 'success', ...dateFilter },
        attributes: ['orderId'],
        raw: true
    });
    const paidOrderIds = ordersWithPayments.map(p => p.orderId);
    
    const cogs = await db.InventoryTransaction.sum('price', {
        where: { 
            type: 'export',
            referenceType: 'order',
            referenceId: { [Op.in]: paidOrderIds }
        }
    }) || 0;

    return res.json({
      success: true,
      data: {
        revenue: {
          total: serviceRevenue + retailRevenue,
          service: serviceRevenue,
          retail: retailRevenue,
          byMethod: totalPayments
        },
        expenses: {
            total: totalExpenses,
            cogs: cogs,
            operating: totalExpenses - cogs > 0 ? totalExpenses - cogs : 0
        },
        netProfit: (serviceRevenue + retailRevenue) - totalExpenses - cogs
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/accountant/cash-flow
// Lấy danh sách sổ quỹ thu/chi
// ============================================================
const getCashFlow = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const where = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const { count, rows } = await CashFlowTransaction.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['fullName'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    res.json({
      success: true,
      data: rows,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/accountant/cash-flow
// Tạo phiếu thu/chi thủ công
// ============================================================
const createCashFlow = async (req, res, next) => {
  try {
    const transaction = await CashFlowTransaction.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/accountant/reconciliation
// Lấy danh sách thanh toán cần đối soát
// ============================================================
const getReconciliation = async (req, res, next) => {
  try {
    const payments = await Payment.findAll({
      where: {
        isReconciled: false,
        [Op.or]: [
          { method: 'vnpay', status: 'success' },
          { method: 'cod' }
        ]
      },
      include: [
          { model: Order, as: 'order', attributes: ['id', 'totalAmount', 'status'] },
          { model: Appointment, as: 'appointment', attributes: ['id', 'totalPrice'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/accountant/reconciliation/:id
// Xác nhận đối soát thanh toán
// ============================================================
const reconcilePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }

    await payment.update({
      status: payment.method === 'cod' ? 'success' : payment.status,
      isReconciled: true,
      reconciledAt: new Date(),
      reconciledBy: req.user.id
    }, { transaction: t });

    if (payment.orderId) {
      await Order.update(
        { paymentStatus: 'paid' },
        { where: { id: payment.orderId }, transaction: t }
      );
    }
    
    if (payment.appointmentId) {
      await Appointment.update(
        { status: 'confirmed' }, 
        { where: { id: payment.appointmentId }, transaction: t }
      );
    }

    // Tự động tạo Phiếu Thu (CashFlowTransaction) vào Sổ cái
    await CashFlowTransaction.create({
      type: 'receipt',
      amount: payment.amount,
      category: 'other', 
      method: payment.method === 'vnpay' ? 'bank' : 'cash',
      status: 'completed',
      referenceType: payment.orderId ? 'order' : 'appointment',
      referenceId: payment.orderId || payment.appointmentId,
      note: `Ghi nhận doanh thu từ ${payment.method.toUpperCase()} cho ${payment.orderId ? 'đơn hàng' : 'lịch hẹn'} #${payment.orderId || payment.appointmentId}`,
      createdBy: req.user.id
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Đã đối soát thành công' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ============================================================
// GET /api/accountant/refunds
// Danh sách yêu cầu hoàn tiền
// ============================================================
const getRefundRequests = async (req, res, next) => {
  try {
    const refunds = await RefundRequest.findAll({
      order: [['createdAt', 'DESC']],
      include: [
          { model: User, as: 'processor', attributes: ['fullName'] }
      ]
    });
    res.json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/accountant/refunds/:id/process
// Xử lý hoàn tiền (Duyệt/Từ chối)
// ============================================================
const processRefund = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { status, note } = req.body;
      const refund = await RefundRequest.findByPk(req.params.id);
      if (!refund) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
  
      await refund.update({
        status,
        processedBy: req.user.id
      }, { transaction: t });
  
      // Nếu được duyệt, tạo một CashFlowTransaction loại 'payment' (Chi)
      if (status === 'approved' || status === 'completed') {
          await CashFlowTransaction.create({
              type: 'payment',
              amount: refund.amount,
              category: 'refund',
              method: 'bank',
              referenceType: refund.type,
              referenceId: refund.targetId,
              note: `Hoàn tiền cho ${refund.type === 'order' ? 'Đơn hàng' : 'Lịch hẹn'} #${refund.targetId}. Lý do: ${refund.reason}`,
              createdBy: req.user.id
          }, { transaction: t });

          // Cập nhật trạng thái thanh toán tương ứng thành 'refunded'
          if (refund.type === 'order') {
              await Payment.update({ status: 'refunded' }, { where: { orderId: refund.targetId }, transaction: t });
          } else {
              await Payment.update({ status: 'refunded' }, { where: { appointmentId: refund.targetId }, transaction: t });
          }

          // Gửi thông báo cho khách hàng: Đã hoàn tiền
          const target = refund.type === 'order' 
            ? await Order.findByPk(refund.targetId) 
            : await Appointment.findByPk(refund.targetId);
            
          if (target && target.userId) {
            await createNotification({
              userId: target.userId,
              title: 'Hoàn tiền thành công',
              message: `Yêu cầu hoàn tiền cho ${refund.type === 'order' ? 'đơn hàng' : 'lịch hẹn'} #${refund.targetId} đã được phê duyệt. Tiền sẽ được hoàn về tài khoản của Quý khách trong thời gian sớm nhất.`,
              type: 'payment'
            });
          }
      }
  
      await t.commit();
      res.json({ success: true, message: 'Đã xử lý yêu cầu hoàn tiền' });
    } catch (error) {
      await t.rollback();
      next(error);
    }
};

module.exports = {
  getFinancialStats,
  getCashFlow,
  createCashFlow,
  getReconciliation,
  reconcilePayment,
  getRefundRequests,
  processRefund
};
