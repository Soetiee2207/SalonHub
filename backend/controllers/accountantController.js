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

const getFinancialStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const isAdmin = req.user.role === 'admin';
    const branchId = req.user.branchId;

    let serviceRevenueWhere = {
      appointmentId: { [Op.ne]: null },
      status: 'success',
      ...dateFilter
    };

    if (!isAdmin && branchId) {
      const branchAppointments = await Appointment.findAll({
        where: { branchId },
        attributes: ['id'],
        raw: true
      });
      const branchApptIds = branchAppointments.map(a => a.id);
      serviceRevenueWhere.appointmentId = { [Op.in]: branchApptIds.length > 0 ? branchApptIds : [0] };
    }

    const serviceRevenue = await Payment.sum('amount', { where: serviceRevenueWhere }) || 0;

    const retailRevenue = await Payment.sum('amount', {
      where: { 
        orderId: { [Op.ne]: null },
        status: 'success',
        ...dateFilter
      }
    }) || 0;

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

    const totalExpenses = await CashFlowTransaction.sum('amount', {
      where: { 
        type: 'payment',
        status: { [Op.in]: ['completed', 'pending'] },
        ...dateFilter
      }
    }) || 0;

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
            referenceId: { [Op.in]: paidOrderIds.length > 0 ? paidOrderIds : [0] }
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
        chartData: await getChartData(startDate, endDate)
      },
    });
  } catch (error) {
    next(error);
  }
};

const getChartData = async (startDate, endDate) => {
    const days = [];
    const now = new Date();
    let startRange, endRange, numDays;

    if (startDate && endDate) {
        startRange = new Date(startDate);
        endRange = new Date(endDate);
        numDays = Math.ceil((endRange - startRange) / (1000 * 60 * 60 * 24)) + 1;
    } else {
        numDays = 7;
        startRange = new Date(now);
        startRange.setDate(now.getDate() - 6);
        endRange = now;
    }
    
    for (let i = 0; i < numDays; i++) {
        const d = new Date(startRange);
        d.setDate(d.getDate() + i);
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));

        const dayName = d.toLocaleDateString('vi-VN', { weekday: 'short' });
        const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;

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

        days.push({ 
          name: numDays > 7 ? dayLabel : dayName, 
          revenue: rev, 
          expenses: exp 
        });
    }
    return days;
};

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

const getReconciliation = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchId = req.user.branchId;

    const payments = await Payment.findAll({
      where: {
        isReconciled: false,
        [Op.or]: [
          { method: 'sepay', status: 'success' },
          { method: 'cod' },
          { method: 'cash' }
        ]
      },
      include: [
          { model: Order, as: 'order', attributes: ['id', 'totalAmount', 'status'] },
          { 
            model: Appointment, as: 'appointment', 
            attributes: ['id', 'totalPrice', 'branchId'] 
          }
      ],
      order: [['createdAt', 'DESC']]
    });

    let filtered = payments;
    if (!isAdmin && branchId) {
      filtered = payments.filter(p => {
        if (p.orderId) return true;
        if (p.appointment && p.appointment.branchId === branchId) return true;
        return false;
      });
    }

    res.json({ success: true, data: filtered });
  } catch (error) {
    next(error);
  }
};

const reconcilePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }

    await payment.update({
      status: (payment.method === 'cod' || payment.method === 'cash') ? 'success' : payment.status,
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

    await CashFlowTransaction.create({
      type: 'receipt',
      amount: payment.amount,
      category: 'other', 
      method: payment.method === 'sepay' ? 'bank' : 'cash',
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

          if (refund.type === 'order') {
              await Payment.update({ status: 'refunded' }, { where: { orderId: refund.targetId }, transaction: t });
          } else {
              await Payment.update({ status: 'refunded' }, { where: { appointmentId: refund.targetId }, transaction: t });
          }

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

        if (type === 'inventory_import') {
            const invTx = await db.InventoryTransaction.findByPk(id, {
                include: [
                    { model: Product, as: 'product', attributes: ['id', 'name', 'image', 'stock'] },
                    { model: User, as: 'creator', attributes: ['fullName', 'email'] },
                    { model: db.ProductBatch, as: 'batch' },
                    { model: Branch, as: 'branch', attributes: ['id', 'name'] },
                ]
            });
            if (!invTx) return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch kho' });
            return res.json({ success: true, data: invTx, referenceType: 'inventory_import' });
        }

        return res.status(400).json({ success: false, message: 'Loại chứng từ không hợp lệ' });
    } catch (error) {
        next(error);
    }
};


/**
 * Tự động hạch toán giao dịch vào sổ quỹ khi thanh toán thành công qua cổng SePay
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

    await payment.update({
      isReconciled: true,
      reconciledAt: new Date(),
    }, { transaction: t });

    await CashFlowTransaction.create({
      type: 'receipt',
      amount: payment.amount,
      category: 'other',
      method: payment.method === 'sepay' ? 'bank' : 'cash',
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
