const { Op } = require('sequelize');
const db = require('../models');
const { 
  CashFlowTransaction, 
  RefundRequest, 
  Payment, 
  Order, 
  OrderItem, 
  Appointment, 
  Service,
  Branch,
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

    // 3. Chi phí vận hành (từ CashFlowTransaction)
    // Bao gồm cả 'completed' và 'pending' để chủ doanh nghiệp thấy được dòng tiền sắp chi
    const totalExpenses = await CashFlowTransaction.sum('amount', {
      where: { 
        type: 'payment',
        status: { [Op.in]: ['completed', 'pending'] },
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
        netProfit: (serviceRevenue + retailRevenue) - totalExpenses - cogs,
        // 5. Dữ liệu biểu đồ 7 ngày gần nhất
        chartData: await getChartData()
      },
    });
  } catch (error) {
    next(error);
  }
};

// Hàm helper tính toán dữ liệu biểu đồ
const getChartData = async () => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));

        const dayName = d.toLocaleDateString('vi-VN', { weekday: 'short' });

        const rev = await Payment.sum('amount', {
            where: { status: 'success', createdAt: { [Op.between]: [start, end] } }
        }) || 0;

        const exp = await CashFlowTransaction.sum('amount', {
            where: { 
                type: 'payment', 
                status: { [Op.in]: ['completed', 'pending'] },
                createdAt: { [Op.between]: [start, end] } 
            }
        }) || 0;

        days.push({ name: dayName, revenue: rev, expenses: exp });
    }
    return days;
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
    const rawRefunds = await RefundRequest.findAll({
      order: [['createdAt', 'DESC']],
      include: [
          { model: User, as: 'processor', attributes: ['fullName'] }
      ]
    });

    const refunds = await Promise.all(rawRefunds.map(async (r) => {
      const refund = r.toJSON();
      if (refund.type === 'order') {
        const order = await Order.findByPk(refund.targetId, {
          include: [{ model: User, as: 'customer', attributes: ['fullName', 'phone', 'email'] }]
        });
        if (order) {
          refund.customerName = order.customer?.fullName || order.customer?.name || 'Khách vãng lai';
          refund.customerPhone = order.customer?.phone || order.phone || 'Không có SĐT';
        }
      } else if (refund.type === 'appointment') {
        const appt = await Appointment.findByPk(refund.targetId, {
          include: [{ model: User, as: 'customer', attributes: ['fullName', 'phone', 'email'] }]
        });
        if (appt && appt.customer) {
          refund.customerName = appt.customer.fullName || appt.customer.name;
          refund.customerPhone = appt.customer.phone || appt.phone || 'Không có SĐT';
        }
      }
      return refund;
    }));

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

// ============================================================
// GET /api/accountant/reference-detail/:type/:id
// Lấy chi tiết gốc của một chứng từ tham chiếu (Order/Appointment)
// ============================================================
const getReferenceDetail = async (req, res, next) => {
    try {
        const { type, id } = req.params;

        if (type === 'order') {
            const order = await Order.findByPk(id, {
                include: [
                    {
                        model: OrderItem,
                        as: 'items',
                        include: [{ model: Product, as: 'product' }]
                    },
                    { model: User, as: 'customer', attributes: ['fullName', 'email', 'phone'] }
                ]
            });
            if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
            return res.json({ success: true, data: order });
        }

        if (type === 'appointment') {
            const appointment = await Appointment.findByPk(id, {
                include: [
                    { model: Service, as: 'service' },
                    { model: User, as: 'customer', attributes: ['fullName', 'email', 'phone'] },
                    { model: User, as: 'staff', attributes: ['fullName'] },
                    { model: Branch, as: 'branch' },
                    { 
                        model: Order, 
                        as: 'upsellOrder', 
                        include: [
                            { 
                                model: OrderItem, 
                                as: 'items', 
                                include: [{ model: Product, as: 'product' }] 
                            }
                        ] 
                    }
                ]
            });
            if (!appointment) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
            return res.json({ success: true, data: appointment });
        }

        return res.status(400).json({ success: false, message: 'Loại chứng từ không hợp lệ' });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// AUTO-ACCOUNTING HELPERS (For Automated Payment Methods)
// ============================================================

/**
 * Tự động hạch toán giao dịch vào sổ quỹ khi thanh toán thành công qua cổng (SePay/VNPay)
 * Bỏ qua bước ĐỐI SOÁT thủ công.
 */
const syncTransactionToCashFlow = async (paymentId, transaction = null) => {
  const t = transaction || await sequelize.transaction();
  try {
    const payment = await db.Payment.findByPk(paymentId, { transaction: t });
    if (!payment || payment.status !== 'success') {
      if (!transaction) await t.rollback();
      return;
    }

    // Đánh dấu đối soát tự động luôn
    await payment.update({
      isReconciled: true,
      reconciledAt: new Date(),
    }, { transaction: t });

    // Tạo phiếu thu ngay vào Sổ quỹ
    await CashFlowTransaction.create({
      type: 'receipt',
      amount: payment.amount,
      category: 'other',
      method: payment.method === 'vnpay' || payment.method === 'sepay' ? 'bank' : 'cash',
      status: 'completed',
      referenceType: payment.orderId ? 'order' : 'appointment',
      referenceId: payment.orderId || payment.appointmentId,
      note: `[TỰ ĐỘNG] Ghi nhận doanh thu qua ${payment.method.toUpperCase()} cho ${payment.orderId ? 'đơn hàng' : 'lịch hẹn'} #${payment.orderId || payment.appointmentId}`,
      createdBy: 1 // System User ID or a generic Admin ID
    }, { transaction: t });

    if (!transaction) await t.commit();
  } catch (error) {
    if (!transaction) await t.rollback();
    console.error('Error in syncTransactionToCashFlow:', error);
    throw error;
  }
};

/**
 * Hạch toán cho đơn hàng (Order)
 */
const syncOrderAccounting = async (orderId, transaction = null) => {
  const payment = await db.Payment.findOne({ 
    where: { orderId, status: 'success' },
    transaction 
  });
  if (payment) {
    await syncTransactionToCashFlow(payment.id, transaction);
  }
};

module.exports = {
  getFinancialStats,
  getCashFlow,
  createCashFlow,
  getReconciliation,
  reconcilePayment,
  getRefundRequests,
  processRefund,
  getReferenceDetail,
  syncTransactionToCashFlow,
  syncOrderAccounting
};
