const { Op } = require('sequelize');
const db = require('../models');
const { InventoryTransaction, Product, User, CashFlowTransaction, sequelize } = db;
const { createNotification } = require('./notificationController');

// ============================================================
// GET /api/inventory/transactions
// Lấy danh sách giao dịch kho với filter và phân trang
// Quyền: admin, warehouse_staff, accountant
// ============================================================
const getTransactions = async (req, res, next) => {
  try {
    const {
      productId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (productId) where.productId = productId;
    if (type) where.type = type;

    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(`${endDate}T23:59:59`)] };
    } else if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { [Op.lte]: new Date(`${endDate}T23:59:59`) };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await InventoryTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'stock', 'reservedStock'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'role'],
        },
        {
          model: db.ProductBatch,
          as: 'batch',
          attributes: ['id', 'batchNumber', 'expiryDate'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/inventory/import
// Nhập hàng vào kho (tăng tồn kho)
// Quyền: admin, warehouse_staff
// ============================================================
const createImport = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { productId, quantity, note, batchNumber, expiryDate, warehouseLocation, purchasePrice, price } = req.body;
    const createdBy = req.user.id;

    if (!productId || !quantity) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'productId và quantity là bắt buộc.',
      });
    }

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.',
      });
    }

    // 1. Tạo hoặc cập nhật Lô hàng (Batch)
    let batchId = null;
    const { ProductBatch } = db;
    
    const batch = await ProductBatch.create({
      productId,
      batchNumber: batchNumber || `BATCH-${Date.now()}`,
      expiryDate: expiryDate || null,
      quantity: parseInt(quantity),
      purchasePrice: purchasePrice || null,
      warehouseLocation: warehouseLocation || null,
    }, { transaction: t });
    batchId = batch.id;

    const stockBefore = product.stock;
    const stockAfter = stockBefore + parseInt(quantity);

    // 2. Cập nhật tồn kho tổng của Sản phẩm
    await product.update({ stock: stockAfter }, { transaction: t });

    // 3. Ghi nhật ký giao dịch
    const transaction = await InventoryTransaction.create({
      productId,
      batchId,
      type: 'import',
      quantity: parseInt(quantity),
      price: price || purchasePrice || null,
      stockBefore,
      stockAfter,
      note: note || `Nhập kho PO lô ${batchNumber || 'mới'}`,
      referenceType: 'manual',
      referenceId: null,
      createdBy,
    }, { transaction: t });

    // 4. Tự động tạo Phiếu Chi (CashFlowTransaction) cho Kế toán
    const actualPurchasePrice = purchasePrice || price;
    if (actualPurchasePrice && parseFloat(actualPurchasePrice) > 0) {
      const totalAmount = parseFloat(actualPurchasePrice) * parseInt(quantity);
      await CashFlowTransaction.create({
        type: 'payment',
        category: 'supplier_payment',
        amount: totalAmount,
        method: 'bank', // Mặc định chuyển khoản, kế toán có thể sửa sau
        status: 'pending',
        referenceType: 'inventory_import',
        referenceId: transaction.id,
        note: `Chi tiền nhập hàng: ${product.name} (SL: ${quantity}) - Lô: ${batchNumber || 'Mới'}`,
        createdBy,
      }, { transaction: t });
    }

    await t.commit();

    const result = await InventoryTransaction.findByPk(transaction.id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'stock'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'role'] },
        { model: db.ProductBatch, as: 'batch' },
      ],
    });

    return res.status(201).json({
      success: true,
      message: `Nhập kho thành công. Lô hàng đã được ghi nhận.`,
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ============================================================
// POST /api/inventory/export
// Xuất hàng khỏi kho thủ công (giảm tồn kho)
// Quyền: admin, warehouse_staff
// ============================================================
const createExport = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { productId, quantity, note, price } = req.body;
    const createdBy = req.user.id;

    if (!productId || !quantity) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'productId và quantity là bắt buộc.',
      });
    }

    if (parseInt(quantity) <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0.',
      });
    }

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.',
      });
    }

    if (product.stock < parseInt(quantity)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Tồn kho không đủ. Hiện có: ${product.stock}, yêu cầu: ${quantity}.`,
      });
    }

    const stockBefore = product.stock;
    const stockAfter = stockBefore - parseInt(quantity);

    await product.update({ stock: stockAfter }, { transaction: t });

    const transaction = await InventoryTransaction.create({
      productId,
      type: 'export',
      quantity: parseInt(quantity),
      price: price || null,
      stockBefore,
      stockAfter,
      note: note || null,
      referenceType: 'manual',
      referenceId: null,
      createdBy,
    }, { transaction: t });

    // 4. Kiểm tra Tồn kho thấp (Low Stock Alert)
    if (stockAfter <= (product.minStock || 5)) {
      await createNotification({
        userId: null, // Gửi chung hoặc hệ thống sẽ handle việc gửi cho admin/warehouse
        title: 'Thông báo: Ngưỡng tồn kho tối thiểu',
        message: `Sản phẩm "${product.name}" hiện chỉ còn ${stockAfter} đơn vị trong kho (Ngưỡng tối thiểu: ${product.minStock || 5}). Quản trị viên vui lòng xem xét nhập thêm hàng.`,
        type: 'inventory',
        role: 'warehouse_staff' // Notification support role-based target if implemented
      });
    }

    await t.commit();

    const result = await InventoryTransaction.findByPk(transaction.id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'stock'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'role'] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: `Xuất kho thành công. Tồn kho: ${stockBefore} → ${stockAfter}`,
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ============================================================
// POST /api/inventory/adjust
// Điều chỉnh tồn kho (set trực tiếp về số mới — dành cho kiểm kê)
// Quyền: admin
// ============================================================
const createAdjustment = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { productId, newStock, quantity, note, price } = req.body;
    const createdBy = req.user.id;

    if (productId === undefined || newStock === undefined) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'productId và newStock là bắt buộc.',
      });
    }

    if (parseInt(newStock) < 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tồn kho mới không được âm.',
      });
    }

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.',
      });
    }

    const stockBefore = product.stock;
    const stockAfter = parseInt(newStock);
    const diff = Math.abs(stockAfter - stockBefore);

    if (diff === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tồn kho mới giống tồn kho hiện tại, không cần điều chỉnh.',
      });
    }

    await product.update({ stock: stockAfter }, { transaction: t });

    const transaction = await InventoryTransaction.create({
      productId,
      type: 'adjust',
      quantity: diff || Math.abs(quantity),
      price: price || null,
      stockBefore,
      stockAfter,
      note: note || `Điều chỉnh kiểm kê: ${stockBefore} → ${stockAfter}`,
      referenceType: 'manual',
      referenceId: null,
      createdBy,
    }, { transaction: t });

    // 4. Kiểm tra Tồn kho thấp (Low Stock Alert)
    if (stockAfter <= (product.minStock || 5)) {
      await createNotification({
        title: 'Cảnh báo: Tồn kho thấp!',
        message: `Sản phẩm "${product.name}" sau điều chỉnh chỉ còn ${stockAfter} món (Ngưỡng: ${product.minStock || 5}).`,
        type: 'inventory',
      });
    }

    await t.commit();

    const result = await InventoryTransaction.findByPk(transaction.id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'stock'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'role'] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: `Điều chỉnh tồn kho thành công. ${stockBefore} → ${stockAfter}`,
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ============================================================
// GET /api/inventory/products/:id/stock
// Xem tồn kho hiện tại + tóm tắt lịch sử của một sản phẩm
// Quyền: admin, warehouse_staff, accountant
// ============================================================
const getProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      attributes: ['id', 'name', 'stock', 'isActive'],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.',
      });
    }

    // Tóm tắt theo loại giao dịch
    const summary = await InventoryTransaction.findAll({
      where: { productId: id },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      ],
      group: ['type'],
      raw: true,
    });

    // 5 giao dịch gần nhất
    const recentTransactions = await InventoryTransaction.findAll({
      where: { productId: id },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    return res.json({
      success: true,
      data: {
        product,
        summary,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/inventory/low-stock
// Danh sách sản phẩm sắp hết hàng (stock <= threshold)
// Quyền: admin, warehouse_staff
// ============================================================
const getLowStockProducts = async (req, res, next) => {
  try {
    const { threshold = 10 } = req.query;

    const products = await Product.findAll({
      where: {
        stock: { [Op.lte]: parseInt(threshold) },
        isActive: true,
      },
      attributes: ['id', 'name', 'stock', 'isActive'],
      order: [['stock', 'ASC']],
    });

    return res.json({
      success: true,
      data: products,
      meta: {
        threshold: parseInt(threshold),
        count: products.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/inventory/stats
// Thống kê dành cho Dashboard Thủ Kho
// Quyền: admin, warehouse_staff
// ============================================================
const getWarehouseStats = async (req, res, next) => {
  try {
    const { Order, ProductBatch } = db;

    // 1. Chỉ số đơn hàng (Orders)
    const orderStats = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        status: ['pending', 'confirmed', 'packing', 'shipping'],
      },
      group: ['status'],
      raw: true,
    });

    // 2. Sản phẩm sắp hết hàng (Low Stock)
    const lowStockCount = await Product.count({
      where: {
        stock: { [Op.lte]: sequelize.col('minStock') },
        isActive: true,
      },
    });

    // 3. Hàng sắp hết hạn (Expiring soon - within 30 days)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const expiringSoonCount = await ProductBatch.count({
      where: {
        expiryDate: {
          [Op.between]: [new Date(), thirtyDaysLater],
        },
        quantity: { [Op.gt]: 0 },
      },
    });

    // 4. Tổng quan tồn kho
    const stockSummary = await Product.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('stock')), 'totalPhysical'],
        [sequelize.fn('SUM', sequelize.col('reservedStock')), 'totalReserved'],
      ],
      raw: true,
    });

    return res.json({
      success: true,
      data: {
        orders: orderStats.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count);
          return acc;
        }, { pending: 0, confirmed: 0, packing: 0, shipping: 0 }),
        lowStockCount,
        expiringSoonCount,
        stockSummary: {
          physical: parseInt(stockSummary[0]?.totalPhysical || 0),
          reserved: parseInt(stockSummary[0]?.totalReserved || 0),
          available: parseInt(stockSummary[0]?.totalPhysical || 0) - parseInt(stockSummary[0]?.totalReserved || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createImport,
  createExport,
  createAdjustment,
  getProductStock,
  getLowStockProducts,
  getWarehouseStats,
};
