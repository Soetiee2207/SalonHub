const crypto = require('crypto');
const querystring = require('qs');
const { Op } = require('sequelize');
const db = require('../models');
const vnpayConfig = require('../config/vnpay');
const { generateVnpayUrl } = require('../utils/vnpayHelper');
const { Order, OrderItem, Cart, Product, ProductCategory, Voucher, User, InventoryTransaction, Payment, ProductReview, sequelize } = db;
const { updateCustomerLoyalty } = require('../utils/loyaltyHelper');
const { createNotification, createRoleNotification } = require('./notificationController');

// Create order from cart
const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { paymentMethod, address, phone, voucherCode, cartItemIds } = req.body;

    // Get cart items
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
        message: 'Cart is empty.',
      });
    }

    // Validate stock for all items
    for (const item of cartItems) {
      if (!item.product || !item.product.isActive) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Product "${item.product ? item.product.name : 'Unknown'}" is no longer available.`,
        });
      }
      if (item.quantity > item.product.stock) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}.`,
        });
      }
    }

    // Calculate subtotal
    let subtotal = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    // Apply voucher if provided
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
          message: 'Invalid voucher code.',
        });
      }

      const today = new Date().toISOString().split('T')[0];
      if (today < voucher.startDate || today > voucher.endDate) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Voucher has expired or is not yet active.',
        });
      }

      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Voucher usage limit reached.',
        });
      }

      if (subtotal < parseFloat(voucher.minOrderValue)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Minimum order value for this voucher is ${voucher.minOrderValue}.`,
        });
      }

      // Calculate discount
      if (voucher.discountType === 'percent') {
        discountAmount = (subtotal * parseFloat(voucher.discount)) / 100;
        if (voucher.maxDiscount !== null && discountAmount > parseFloat(voucher.maxDiscount)) {
          discountAmount = parseFloat(voucher.maxDiscount);
        }
      } else {
        discountAmount = parseFloat(voucher.discount);
      }

      voucherId = voucher.id;

      // Increment used count
      await voucher.update(
        { usedCount: voucher.usedCount + 1 },
        { transaction: t }
      );
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Create order
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

    // Create order items and reduce stock
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

      const resStockBefore = item.product.reservedStock;
      const resStockAfter = resStockBefore + item.quantity;

      await item.product.update(
        { reservedStock: resStockAfter },
        { transaction: t }
      );

      // Ghi chú: Chờ xuất kho khi đóng gói xong
    }

    // Clear only selected items from cart
    const finalCartItemIds = cartItems.map(item => item.id);
    await Cart.destroy({ 
      where: { 
        id: { [Op.in]: finalCartItemIds },
        userId 
      }, 
      transaction: t 
    });

    // Create Payment record as "pending"
    await Payment.create({
      userId,
      orderId: order.id,
      amount: totalAmount.toFixed(2),
      method: paymentMethod,
      status: 'pending',
      isReconciled: false
    }, { transaction: t });

    await t.commit();

    // Fetch the complete order
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

    const responseData = { order: result };

    // Generate VNPay URL if payment method is vnpay
    if (paymentMethod === 'vnpay') {
      const vnpayUrl = generateVnpayUrl({
        amount: order.totalAmount,
        txnRef: `ORDER_${order.id}`,
        orderInfo: `Thanh toan don hang ${order.id}`,
        ipAddr: req.ip || '127.0.0.1'
      });
      responseData.paymentUrl = vnpayUrl;
    }

    // --- REAL-TIME NOTIFICATIONS ---
    // 1. Notify Warehouse Staff
    await createRoleNotification('warehouse_staff', {
      title: 'Đơn hàng mới chờ xử lý',
      message: `Đơn hàng #${order.id} vừa được đặt thành công. Vui lòng kiểm tra và đóng gói. Tổng tiền: ${Math.floor(totalAmount).toLocaleString()}đ`,
      type: 'order'
    });

    // 2. Notify Customer (Confirmed receipt of order request)
    await createNotification({
      userId,
      title: 'Đặt hàng thành công',
      message: `Đơn hàng #${order.id} của bạn đã được tiếp nhận và đang chờ xác nhận.`,
      type: 'order'
    });

    res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};



// Get my orders
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
      ],
      order: [['createdAt', 'DESC']],
    });

    // For each order, check which items have been reviewed
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

// Get order by ID
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
        { model: User, as: 'customer', attributes: { exclude: ['password'] } },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Customer can only see own orders
    if (user.role === 'customer' && order.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this order.',
      });
    }

    // Check which items in this order have been reviewed by the user
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

// Get all orders (admin/staff)
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

// Update order status (admin/staff)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'packing', 'shipping', 'delivered', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Phải là: ${validStatuses.join(', ')}`,
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

    // Logic xử lý kho khi chuyển trạng thái
    const t = await sequelize.transaction();
    try {
      // 1. Chuyển sang packing: Trừ tồn kho thực tế, trừ tồn kho tạm giữ
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

            // Ghi nhật ký xuất kho thực tế (Sổ quỹ kho)
            await InventoryTransaction.create({
              productId: item.productId,
              type: 'export',
              quantity: item.quantity,
              stockBefore,
              stockAfter,
              note: `Xuất kho thực tế (Đang đóng gói) cho đơn #${order.id}`,
              referenceType: 'order',
              referenceId: order.id,
              createdBy: req.user.id
            }, { transaction: t });

            // Kiểm tra Tồn kho thấp (Low Stock Alert)
            if (stockAfter <= (product.minStock || 5)) {
              const { createNotification } = require('./notificationController');
              await createNotification({
                title: 'Cảnh báo: Tồn kho thấp từ Đơn hàng!',
                message: `Sản phẩm "${product.name}" chỉ còn ${stockAfter} món sau khi đóng gói Đơn #${order.id}.`,
                type: 'inventory',
              });
            }
          }
        }
      }

      // 2. Chuyển sang cancelled: Hoàn lại tồn kho
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
              
              // Ghi nhật ký nhập kho hoàn trả
              await InventoryTransaction.create({
                productId: item.productId,
                type: 'import',
                quantity: item.quantity,
                stockBefore,
                stockAfter,
                note: `Nhập kho hoàn trả (Đơn #${order.id} bị hủy sau khi đã đóng gói)`,
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

      await order.update(updateData, { transaction: t });

      // --- REAL-TIME NOTIFICATION TO CUSTOMER ---
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

      // Tích điểm nếu đơn hàng mới chuyển sang trạng thái Thành công
      if (oldStatus !== 'completed' && newStatus === 'completed') {
        const totalAmount = parseFloat(order.totalAmount) || 0;
        await updateCustomerLoyalty(order.userId, totalAmount / 1000, t);
      }

      // Tự động khách yêu cầu hoàn tiền nếu đơn đã thanh toán hoàn tất (VNPay)
      if (order.paymentStatus === 'paid' && newStatus === 'cancelled') {
        const { RefundRequest } = db;
        await RefundRequest.create({
          type: 'order',
          targetId: order.id,
          amount: order.totalAmount,
          reason: req.body.cancelReason || 'Hệ thống/Quản trị viên hủy đơn hàng sau khi hoàn tất thanh toán',
          status: 'pending'
        }, { transaction: t });
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

// Cancel order (customer cancels own pending order)
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

    // Hoàn reservedStock
    for (const item of order.items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        await product.update(
          { reservedStock: Math.max(0, product.reservedStock - item.quantity) },
          { transaction: t }
        );
      }
    }

    // Tự động khách yêu cầu hoàn tiền nếu đơn đã thanh toán hoàn tất (VNPay)
    if (order.paymentStatus === 'paid') {
      const { RefundRequest } = db;
      await RefundRequest.create({
        type: 'order',
        targetId: order.id,
        amount: order.totalAmount,
        reason: cancelReason || 'Khách hàng tự hủy đơn hàng sau khi hoàn tất thanh toán',
        status: 'pending'
      }, { transaction: t });
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

// Customer confirms receipt of order
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

    // Only allow completion if shipping or delivered
    if (!['shipping', 'delivered'].includes(order.status)) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn hàng chưa ở trạng thái có thể xác nhận nhận hàng' 
      });
    }

    await order.update({ status: 'completed' }, { transaction: t });

    // Tích điểm thưởng cho khách hàng
    const totalAmount = parseFloat(order.totalAmount) || 0;
    await updateCustomerLoyalty(order.userId, totalAmount / 1000, t);

    await t.commit();
    res.json({
      success: true,
      message: 'Xác nhận nhận hàng thành công. Chúc mừng sư huynh đã hoàn thành vận tiêu!',
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
  cancelOrder,
  confirmOrderReceipt
};
