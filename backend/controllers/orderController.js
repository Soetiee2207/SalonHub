const crypto = require('crypto');
const querystring = require('qs');
const db = require('../models');
const vnpayConfig = require('../config/vnpay');
const { Order, OrderItem, Cart, Product, ProductCategory, Voucher, User, sequelize } = db;

// Create order from cart
const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { paymentMethod, address, phone, voucherCode } = req.body;

    // Get cart items
    const cartItems = await Cart.findAll({
      where: { userId },
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

      await item.product.update(
        { stock: item.product.stock - item.quantity },
        { transaction: t }
      );
    }

    // Clear cart
    await Cart.destroy({ where: { userId }, transaction: t });

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
      const vnpayUrl = generateVnpayUrl(order);
      responseData.paymentUrl = vnpayUrl;
    }

    res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Helper: sort object keys alphabetically and encode values
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
  }
  return sorted;
}

// Generate VNPay payment URL
function generateVnpayUrl(order) {
  const date = new Date();
  const createDate = date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

  let vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: order.id.toString(),
    vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(parseFloat(order.totalAmount) * 100),
    vnp_ReturnUrl: vnpayConfig.returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  // Sort and encode params
  vnpParams = sortObject(vnpParams);

  const signData = querystring.stringify(vnpParams, { encode: false });
  const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  vnpParams.vnp_SecureHash = signed;

  return `${vnpayConfig.url}?${querystring.stringify(vnpParams, { encode: false })}`;
}

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

    res.json({
      success: true,
      data: orders,
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

    res.json({
      success: true,
      data: order,
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

    const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Phải là: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    await order.update({ status });

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

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        await product.update(
          { stock: product.stock + item.quantity },
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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};
