const crypto = require('crypto');
const querystring = require('qs');
const { Op } = require('sequelize');
const db = require('../models');
const { Order, OrderItem, Cart, Product, ProductCategory, Voucher, User, InventoryTransaction, Payment, ProductReview, ReturnRequest, sequelize } = db;
const { updateCustomerLoyalty } = require('../utils/loyaltyHelper');
const { createNotification, createRoleNotification } = require('./notificationController');

const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { paymentMethod, address, phone, voucherCode, cartItemIds } = req.body;

    const cartWhere = { userId };
    if (cartItemIds && Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      cartWhere.id = { [Op.in]: cartItemIds };
    }

    const cartItems = await Cart.findAll({
      where: cartWhere,
      include: [{ model: Product, as: 'product' }],
      transaction: t,
    });

    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống.',
      });
    }

    for (const item of cartItems) {
      if (!item.product || !item.product.isActive) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.product ? item.product.name : 'Không xác định'}" hiện không khả dụng.`,
        });
      }
      if (item.quantity > item.product.stock) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Số lượng tồn kho không đủ cho "${item.product.name}". Còn lại: ${item.product.stock}.`,
        });
      }
    }

    let subtotal = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    let voucherId = null;
    let discountAmount = 0;

    if (voucherCode) {
      const voucher = await Voucher.findOne({
        where: { code: voucherCode, isActive: true },
        transaction: t,
      });

      if (!voucher) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không hợp lệ.',
        });
      }

      const today = new Date().toISOString().split('T')[0];
      if (today < voucher.startDate || today > voucher.endDate) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã hết hạn hoặc chưa được kích hoạt.',
        });
      }

      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã đạt giới hạn sử dụng.',
        });
      }

      if (subtotal < parseFloat(voucher.minOrderValue)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Giá trị đơn hàng tối thiểu để sử dụng mã này là ${voucher.minOrderValue}.`,
        });
      }

      if (voucher.discountType === 'percent') {
        discountAmount = (subtotal * parseFloat(voucher.discount)) / 100;
        if (voucher.maxDiscount !== null && discountAmount > parseFloat(voucher.maxDiscount)) {
          discountAmount = parseFloat(voucher.maxDiscount);
        }
      } else {
        discountAmount = parseFloat(voucher.discount);
      }

      voucherId = voucher.id;

      await voucher.update(
        { usedCount: voucher.usedCount + 1 },
        { transaction: t }
      );
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    const order = await Order.create(
      {
        userId,
        totalAmount: totalAmount.toFixed(2),
        paymentMethod,
        address,
        phone,
        voucherId,
        discountAmount: discountAmount.toFixed(2),
      },
      { transaction: t }
    );

    for (const item of cartItems) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        },
        { transaction: t }
      );

      await item.product.update(
        { reservedStock: item.product.reservedStock + item.quantity },
        { transaction: t }
      );
    }

    const finalCartItemIds = cartItems.map(item => item.id);
    await Cart.destroy({ 
      where: { 
        id: { [Op.in]: finalCartItemIds },
        userId 
      }, 
      transaction: t 
    });

    await Payment.create({
      userId,
      orderId: order.id,
      amount: totalAmount.toFixed(2),
      method: paymentMethod,
      status: 'pending',
      isReconciled: false
    }, { transaction: t });

    await t.commit();

    const result = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
        { model: Voucher, as: 'voucher' },
      ],
    });

    await createRoleNotification('warehouse_staff', {
      title: 'Đơn hàng mới chờ xử lý',
      message: `Đơn hàng #${order.id} vừa được đặt thành công. Vui lòng kiểm tra và đóng gói. Tổng tiền: ${Math.floor(totalAmount).toLocaleString()}đ`,
      type: 'order'
    });

    await createNotification({
      userId,
      title: 'Đặt hàng thành công',
      message: `Đơn hàng #${order.id} của bạn đã được tiếp nhận và đang chờ xác nhận.`,
      type: 'order'
    });

    res.status(201).json({
      success: true,
      data: { order: result },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: ProductCategory, as: 'category' }],
            },
          ],
        },
        { model: Voucher, as: 'voucher' },
        { model: ReturnRequest, as: 'returnRequest' },
      ],
      order: [['createdAt', 'DESC']],
    });

    const ordersWithReviewInfo = await Promise.all(orders.map(async (order) => {
      const orderJson = order.toJSON();
      const itemsWithReviewInfo = await Promise.all(orderJson.items.map(async (item) => {
        const review = await ProductReview.findOne({
          where: { userId, productId: item.productId }
        });
        return { ...item, isReviewed: !!review };
      }));
      orderJson.items = itemsWithReviewInfo;
      return orderJson;
    }));

    res.json({
      success: true,
      data: ordersWithReviewInfo,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: ProductCategory, as: 'category' }],
            },
          ],
        },
        { model: Voucher, as: 'voucher' },
        { model: ReturnRequest, as: 'returnRequest' },
        { model: User, as: 'customer', attributes: { exclude: ['password'] } },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (user.role === 'customer' && order.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this order.',
      });
    }

    const orderJson = order.toJSON();
    const itemsWithReviewInfo = await Promise.all(orderJson.items.map(async (item) => {
      const review = await ProductReview.findOne({
        where: { userId: order.userId, productId: item.productId }
      });
      return { ...item, isReviewed: !!review };
    }));
    orderJson.items = itemsWithReviewInfo;

    res.json({
      success: true,
      data: orderJson,
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
        { model: User, as: 'customer', attributes: { exclude: ['password'] } },
        { model: Voucher, as: 'voucher' },
        { model: ReturnRequest, as: 'returnRequest' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'packing', 'shipping', 'delivered', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ.`,
      });
    }

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }]
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const oldStatus = order.status;
    const newStatus = status;

    const t = await sequelize.transaction();
    try {
      if (oldStatus !== 'packing' && newStatus === 'packing') {
        for (const item of order.items) {
          const product = await Product.findByPk(item.productId, { transaction: t });
          if (product) {
            const stockBefore = product.stock;
            const stockAfter = stockBefore - item.quantity;
            const resStockAfter = Math.max(0, product.reservedStock - item.quantity);

            await product.update({
              stock: stockAfter,
              reservedStock: resStockAfter
            }, { transaction: t });

            const branchStock = await db.ProductBatch.findAll({
              attributes: [
                'branchId',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQty'],
              ],
              where: { productId: item.productId, quantity: { [Op.gt]: 0 } },
              group: ['branchId'],
              order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
              raw: true,
              transaction: t,
            });

            const targetBranchId = branchStock.length > 0 ? branchStock[0].branchId : null;

            let remaining = item.quantity;
            const batchWhere = { productId: item.productId, quantity: { [Op.gt]: 0 } };
            if (targetBranchId) batchWhere.branchId = targetBranchId;

            const batches = await db.ProductBatch.findAll({
              where: batchWhere,
              order: [['createdAt', 'ASC']],
              transaction: t,
            });

            for (const batch of batches) {
              if (remaining <= 0) break;
              const deduct = Math.min(remaining, batch.quantity);
              await batch.update({ quantity: batch.quantity - deduct }, { transaction: t });
              remaining -= deduct;
            }

            await InventoryTransaction.create({
              productId: item.productId,
              type: 'export',
              quantity: item.quantity,
              stockBefore,
              stockAfter,
              note: `Xuất kho thực tế (Đang đóng gói) cho đơn #${order.id}`,
              referenceType: 'order',
              referenceId: order.id,
              createdBy: req.user.id,
              branchId: targetBranchId,
            }, { transaction: t });
          }
        }
      }

      if (newStatus === 'cancelled') {
        const needsStockRestore = ['packing', 'shipping', 'delivered'].includes(oldStatus);
        const needsReservedReduce = ['pending', 'confirmed'].includes(oldStatus);

        for (const item of order.items) {
          const product = await Product.findByPk(item.productId, { transaction: t });
          if (product) {
            if (needsStockRestore) {
              const stockBefore = product.stock;
              const stockAfter = stockBefore + item.quantity;
              await product.update({ stock: stockAfter }, { transaction: t });
              
              await InventoryTransaction.create({
                productId: item.productId,
                type: 'import',
                quantity: item.quantity,
                stockBefore,
                stockAfter,
                note: `Nhập kho hoàn trả (Đơn #${order.id} bị hủy)`,
                referenceType: 'order',
                referenceId: order.id,
                createdBy: req.user.id
              }, { transaction: t });
            }
            if (needsReservedReduce) {
              await product.update({
                reservedStock: Math.max(0, product.reservedStock - item.quantity)
              }, { transaction: t });
            }
          }
        }
      }

      const updateData = { status: newStatus };
      await order.update(updateData, { transaction: t });

      const statusLabels = {
        confirmed: 'đã được xác nhận',
        packing: 'đang được đóng gói',
        shipping: 'đang trên đường vận chuyển',
        delivered: 'đã được giao tới bạn',
        completed: 'đã hoàn thành',
        cancelled: 'đã bị hủy'
      };

      if (statusLabels[newStatus]) {
        await createNotification({
          userId: order.userId,
          title: `Cập nhật đơn hàng #${order.id}`,
          message: `Đơn hàng của bạn ${statusLabels[newStatus]}.`,
          type: 'order'
        });
      }

      if (oldStatus !== 'completed' && newStatus === 'completed') {
        const totalAmount = parseFloat(order.totalAmount) || 0;
        await updateCustomerLoyalty(order.userId, totalAmount / 1000, t);
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    const result = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
        { model: User, as: 'customer', attributes: { exclude: ['password'] } },
        { model: ReturnRequest, as: 'returnRequest' },
      ],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.userId !== userId) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own orders.',
      });
    }

    if (order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled.',
      });
    }

    for (const item of order.items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        await product.update(
          { reservedStock: Math.max(0, product.reservedStock - item.quantity) },
          { transaction: t }
        );
      }
    }

    await order.update({ status: 'cancelled' }, { transaction: t });

    await t.commit();

    const result = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const getOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      attributes: ['id', 'status', 'paymentStatus']
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

const confirmOrderReceipt = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId },
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (!['shipping', 'delivered'].includes(order.status)) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn hàng chưa ở trạng thái có thể xác nhận nhận hàng' 
      });
    }

    await order.update({ status: 'completed' }, { transaction: t });

    const totalAmount = parseFloat(order.totalAmount) || 0;
    await updateCustomerLoyalty(order.userId, totalAmount / 1000, t);

    await t.commit();
    res.json({
      success: true,
      message: 'Xác nhận nhận hàng thành công.',
      data: order
    });
  } catch (error) {
    if (t) await t.rollback();
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderStatus,
  cancelOrder,
  confirmOrderReceipt
};
