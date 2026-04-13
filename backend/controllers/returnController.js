const db = require('../models');
const { ReturnRequest, Order, OrderItem, Product, User, sequelize } = db;
const { createNotification, createRoleNotification } = require('./notificationController');

// Khách hàng tạo yêu cầu trả hàng
const createReturnRequest = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { orderId, reason, images } = req.body;

    // 1. Kiểm tra đơn hàng tồn tại và thuộc về khách hàng
    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{ model: ReturnRequest, as: 'returnRequest' }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // 2. Kiểm tra điều kiện trả hàng (phải là đã giao hoặc đã hoàn thành)
    if (!['delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn hàng chưa ở trạng thái có thể yêu cầu trả hàng (phải là Đã giao hoặc Hoàn thành)' 
      });
    }

    // 3. Kiểm tra xem đã có yêu cầu chưa
    if (order.returnRequest) {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã có yêu cầu trả hàng' });
    }

    // 4. Tạo yêu cầu trả hàng
    const returnRequest = await ReturnRequest.create({
      orderId,
      userId,
      reason,
      images: images || [],
      status: 'pending'
    }, { transaction: t });

    await t.commit();

    // Thông báo cho Admin/Staff
    await createRoleNotification('admin', {
      title: 'Yêu cầu trả hàng mới',
      message: `Khách hàng vừa gửi yêu cầu trả hàng cho đơn #${orderId}. Lý do: ${reason}`,
      type: 'order'
    });

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu trả hàng thành công. Vui lòng chờ quản trị viên phê duyệt.',
      data: returnRequest
    });
  } catch (error) {
    if (t) await t.rollback();
    next(error);
  }
};

// Admin/Staff lấy tất cả yêu cầu trả hàng
const getAllReturnRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const returns = await ReturnRequest.findAll({
      where,
      include: [
        { model: Order, as: 'order', include: [{ model: OrderItem, as: 'items', include: ['product'] }] },
        { model: User, as: 'user', attributes: ['id', 'fullName', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

// Khách hàng lấy danh sách yêu cầu trả hàng của mình
const getMyReturnRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const returns = await ReturnRequest.findAll({
      where: { userId },
      include: [
        { model: Order, as: 'order', include: [{ model: OrderItem, as: 'items', include: ['product'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

// Admin cập nhật trạng thái yêu cầu trả hàng
const updateReturnRequestStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const returnRequest = await ReturnRequest.findByPk(id, {
      include: [{ 
        model: Order, 
        as: 'order',
        include: [{ model: OrderItem, as: 'items' }]
      }]
    });

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu trả hàng' });
    }

    const oldStatus = returnRequest.status;
    const newStatus = status;

    // logic xử lý đặc biệt khi hoàn thành trả hàng
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      const { RefundRequest, InventoryTransaction, Product } = db;

      // 1. Phục hồi tồn kho (stock) và ghi nhận giao dịch kho
      // Chỉ khi đơn đã từng xuất kho (packing, shipping, delivered, completed)
      if (['packing', 'shipping', 'delivered', 'completed'].includes(returnRequest.order.status)) {
        for (const item of returnRequest.order.items) {
          const product = await Product.findByPk(item.productId, { transaction: t });
          if (product) {
            const stockBefore = product.stock;
            const stockAfter = stockBefore + item.quantity;
            
            await product.update({ stock: stockAfter }, { transaction: t });
            
            await InventoryTransaction.create({
              productId: product.id,
              type: 'import',
              quantity: item.quantity,
              stockBefore,
              stockAfter,
              note: `Nhập kho hoàn trả (Yêu cầu trả hàng #${id})`,
              referenceType: 'order',
              referenceId: returnRequest.orderId,
              createdBy: req.user.id
            }, { transaction: t });
          }
        }
      }

      // 2. Có thể tự động tạo RefundRequest nếu đơn đã thanh toán
      if (returnRequest.order.paymentStatus === 'paid') {
        await RefundRequest.create({
          type: 'order',
          targetId: returnRequest.orderId,
          amount: returnRequest.order.totalAmount,
          reason: `Hoàn tiền sau khi hoàn tất trả hàng #${id}`,
          status: 'pending'
        }, { transaction: t });
      }
      
      // 3. Chuyển trạng thái đơn hàng sang cancelled
      await Order.update({ status: 'cancelled' }, { 
        where: { id: returnRequest.orderId }, 
        transaction: t 
      });
    }

    await returnRequest.update({ status: newStatus, adminNote }, { transaction: t });

    await t.commit();

    // Thông báo cho khách hàng
    const statusMsgs = {
      approved: 'đã được chấp nhận. Vui lòng gửi hàng lại cho chúng tôi.',
      rejected: 'đã bị từ chối.',
      receiving: 'đã được chúng tôi tiếp nhận hàng gửi về.',
      completed: 'đã hoàn tất. Chúng tôi sẽ tiến hành hoàn tiền (nếu có).'
    };

    if (statusMsgs[newStatus]) {
      await createNotification({
        userId: returnRequest.userId,
        title: `Cập nhật yêu cầu trả hàng đơn #${returnRequest.orderId}`,
        message: `Yêu cầu trả hàng của bạn ${statusMsgs[newStatus]}`,
        type: 'order'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: returnRequest
    });
  } catch (error) {
    if (t) await t.rollback();
    next(error);
  }
};

module.exports = {
  createReturnRequest,
  getAllReturnRequests,
  getMyReturnRequests,
  updateReturnRequestStatus
};
