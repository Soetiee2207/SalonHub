const db = require('../models');
const { ReturnRequest, Order, OrderItem, Product, User, sequelize } = db;
const { createNotification, createRoleNotification } = require('./notificationController');

const createReturnRequest = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { orderId, reason, images } = req.body;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{ model: ReturnRequest, as: 'returnRequest' }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (!['delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn hàng chưa ở trạng thái có thể yêu cầu trả hàng (phải là Đã giao hoặc Hoàn thành)' 
      });
    }

    if (order.returnRequest) {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã có yêu cầu trả hàng' });
    }

    const returnRequest = await ReturnRequest.create({
      orderId,
      userId,
      reason,
      images: images || [],
      status: 'pending'
    }, { transaction: t });

    await t.commit();

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

    if (newStatus === 'completed' && oldStatus !== 'completed') {
      const { RefundRequest, InventoryTransaction, Product } = db;

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

      if (returnRequest.order.paymentStatus === 'paid') {
        await RefundRequest.create({
          type: 'order',
          targetId: returnRequest.orderId,
          amount: returnRequest.order.totalAmount,
          reason: `Hoàn tiền sau khi hoàn tất trả hàng #${id}`,
          status: 'pending'
        }, { transaction: t });
      }
      
      await Order.update({ status: 'cancelled' }, { 
        where: { id: returnRequest.orderId }, 
        transaction: t 
      });
    }

    await returnRequest.update({ status: newStatus, adminNote }, { transaction: t });

    await t.commit();

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
