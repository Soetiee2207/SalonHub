const { Op } = require('sequelize');
const db = require('../models');
const { InventoryTransaction, Product, User, CashFlowTransaction, Branch, sequelize } = db;
const { createNotification, createBranchRoleNotification } = require('./notificationController');

const getBranchStock = async (productId, branchId, transaction = null) => {
  const result = await db.ProductBatch.sum('quantity', {
    where: { productId, branchId },
    ...(transaction ? { transaction } : {})
  });
  return result || 0;
};

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

    if (req.user.role !== 'admin') {
      where.branchId = req.user.branchId;
    }

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
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
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

const createImport = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { productId, quantity, note, batchNumber, expiryDate, warehouseLocation, purchasePrice, price } = req.body;
    const createdBy = req.user.id;
    const branchId = req.user.branchId;

    if (!productId || !quantity) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'productId và quantity là bắt buộc.',
      });
    }

    if (!branchId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Bạn chưa được gán chi nhánh. Vui lòng liên hệ Admin.',
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

    const { ProductBatch } = db;
    
    const batch = await ProductBatch.create({
      productId,
      batchNumber: batchNumber || `BATCH-${Date.now()}`,
      expiryDate: expiryDate || null,
      quantity: parseInt(quantity),
      purchasePrice: purchasePrice || null,
      warehouseLocation: warehouseLocation || null,
      branchId,
    }, { transaction: t });

    const stockBefore = product.stock;
    const stockAfter = stockBefore + parseInt(quantity);

    await product.update({ stock: stockAfter }, { transaction: t });

    const transaction = await InventoryTransaction.create({
      productId,
      batchId: batch.id,
      type: 'import',
      quantity: parseInt(quantity),
      price: price || purchasePrice || null,
      stockBefore,
      stockAfter,
      note: note || `Nhập kho PO lô ${batchNumber || 'mới'}`,
      referenceType: 'manual',
      referenceId: null,
      createdBy,
      branchId,
    }, { transaction: t });

    const actualPurchasePrice = purchasePrice || price;
    if (actualPurchasePrice && parseFloat(actualPurchasePrice) > 0) {
      const totalAmount = parseFloat(actualPurchasePrice) * parseInt(quantity);
      await CashFlowTransaction.create({
        type: 'payment',
        category: 'supplier_payment',
        amount: totalAmount,
        method: 'bank',
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
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
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

const createExport = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { productId, quantity, note, price } = req.body;
    const createdBy = req.user.id;
    const branchId = req.user.branchId;

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

    const branchStock = await getBranchStock(productId, branchId, t);

    if (branchStock < parseInt(quantity)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Tồn kho chi nhánh không đủ. Hiện có: ${branchStock}, yêu cầu: ${quantity}.`,
      });
    }

    const stockBefore = product.stock;
    const stockAfter = stockBefore - parseInt(quantity);

    await product.update({ stock: stockAfter }, { transaction: t });

    let remaining = parseInt(quantity);
    const batches = await db.ProductBatch.findAll({
      where: { productId, branchId, quantity: { [Op.gt]: 0 } },
      order: [['createdAt', 'ASC']],
      transaction: t,
    });

    for (const batch of batches) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, batch.quantity);
      await batch.update({ quantity: batch.quantity - deduct }, { transaction: t });
      remaining -= deduct;
    }

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
      branchId,
    }, { transaction: t });

    const newBranchStock = branchStock - parseInt(quantity);
    if (newBranchStock <= (product.minStock || 5)) {
      await createBranchRoleNotification('warehouse_staff', branchId, {
        title: 'Cảnh báo: Tồn kho chi nhánh thấp!',
        message: `Sản phẩm "${product.name}" tại chi nhánh của bạn chỉ còn ${newBranchStock} đơn vị (Ngưỡng: ${product.minStock || 5}). Vui lòng nhập thêm hàng.`,
        type: 'inventory',
      });
    }

    await t.commit();

    const result = await InventoryTransaction.findByPk(transaction.id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'stock'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'role'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: `Xuất kho thành công. Tồn kho tổng: ${stockBefore} → ${stockAfter}`,
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const createAdjustment = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { productId, newStock, quantity, note, price } = req.body;
    const createdBy = req.user.id;
    const branchId = req.user.branchId;

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
      branchId,
    }, { transaction: t });

    if (stockAfter <= (product.minStock || 5)) {
      if (branchId) {
        await createBranchRoleNotification('warehouse_staff', branchId, {
          title: 'Cảnh báo: Tồn kho thấp!',
          message: `Sản phẩm "${product.name}" sau điều chỉnh chỉ còn ${stockAfter} món (Ngưỡng: ${product.minStock || 5}).`,
          type: 'inventory',
        });
      } else {
        await createNotification({
          title: 'Cảnh báo: Tồn kho thấp!',
          message: `Sản phẩm "${product.name}" sau điều chỉnh chỉ còn ${stockAfter} món (Ngưỡng: ${product.minStock || 5}).`,
          type: 'inventory',
        });
      }
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

    const branchStocks = await db.ProductBatch.findAll({
      where: { productId: id },
      attributes: [
        'branchId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalStock'],
      ],
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
      group: ['branchId'],
      raw: false,
    });

    const txWhere = { productId: id };
    if (req.user.role !== 'admin') {
      txWhere.branchId = req.user.branchId;
    }

    const summary = await InventoryTransaction.findAll({
      where: txWhere,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      ],
      group: ['type'],
      raw: true,
    });

    const recentTransactions = await InventoryTransaction.findAll({
      where: txWhere,
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
        branchStocks,
        summary,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockProducts = async (req, res, next) => {
  try {
    const { threshold = 10 } = req.query;

    if (req.user.role !== 'admin' && req.user.branchId) {
      const branchProducts = await db.ProductBatch.findAll({
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('ProductBatch.quantity')), 'branchStock'],
        ],
        where: { branchId: req.user.branchId },
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'stock', 'isActive'], where: { isActive: true } }],
        group: ['productId'],
        having: sequelize.where(sequelize.fn('SUM', sequelize.col('ProductBatch.quantity')), '<=', parseInt(threshold)),
        raw: false,
      });

      return res.json({
        success: true,
        data: branchProducts.map(bp => ({
          id: bp.product?.id,
          name: bp.product?.name,
          stock: parseInt(bp.dataValues.branchStock) || 0,
          totalStock: bp.product?.stock,
          isActive: bp.product?.isActive,
        })),
        meta: { threshold: parseInt(threshold), count: branchProducts.length },
      });
    }

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

const getWarehouseStats = async (req, res, next) => {
  try {
    const { Order, ProductBatch } = db;
    const isAdmin = req.user.role === 'admin';
    const branchId = req.user.branchId;

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

    let lowStockCount;
    if (isAdmin) {
      lowStockCount = await Product.count({
        where: {
          stock: { [Op.lte]: sequelize.col('minStock') },
          isActive: true,
        },
      });
    } else {
      const [results] = await sequelize.query(`
        SELECT COUNT(DISTINCT pb.productId) as cnt 
        FROM product_batches pb 
        JOIN products p ON pb.productId = p.id 
        WHERE pb.branchId = :branchId AND p.isActive = 1
        GROUP BY pb.productId 
        HAVING SUM(pb.quantity) <= COALESCE(p.minStock, 5)
      `, { replacements: { branchId }, type: sequelize.QueryTypes.SELECT });
      lowStockCount = results?.cnt || 0;
    }

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    const batchWhere = {
      expiryDate: { [Op.between]: [new Date(), thirtyDaysLater] },
      quantity: { [Op.gt]: 0 },
    };
    if (!isAdmin && branchId) batchWhere.branchId = branchId;

    const expiringSoonCount = await ProductBatch.count({ where: batchWhere });

    const expiringSoonItems = await ProductBatch.findAll({
      where: batchWhere,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'image'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      ],
      limit: 5,
      order: [['expiryDate', 'ASC']]
    });

    let stockSummary;
    if (isAdmin) {
      stockSummary = await Product.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('stock')), 'totalPhysical'],
          [sequelize.fn('SUM', sequelize.col('reservedStock')), 'totalReserved'],
        ],
        raw: true,
      });
    } else {
      const branchSum = await ProductBatch.findAll({
        where: { branchId },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalPhysical'],
        ],
        raw: true,
      });
      stockSummary = [{ totalPhysical: branchSum[0]?.totalPhysical || 0, totalReserved: 0 }];
    }

    return res.json({
      success: true,
      data: {
        orders: orderStats.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count);
          return acc;
        }, { pending: 0, confirmed: 0, packing: 0, shipping: 0 }),
        lowStockCount,
        expiringSoonCount,
        expiringSoonItems,
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

const updateBatchLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { warehouseLocation } = req.body;
    const { ProductBatch } = db;

    const batch = await ProductBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lô hàng' });
    }

    await batch.update({ warehouseLocation });

    res.json({ success: true, message: 'Đã cập nhật vị trí kho' });
  } catch (error) {
    next(error);
  }
};

const normalizeProductBatches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Product, ProductBatch } = db;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Sản phẩm không có tồn kho để chuẩn hóa' });
    }

    const existingBatchesCount = await ProductBatch.count({ where: { productId: id } });
    if (existingBatchesCount > 0) {
      return res.status(400).json({ success: false, message: 'Sản phẩm đã có dữ liệu lô hàng' });
    }

    await ProductBatch.create({
      productId: id,
      batchNumber: `LEGACY-${product.sku || id}`,
      quantity: product.stock,
      warehouseLocation: 'Chờ phân phối',
      branchId: req.user.branchId || null,
      note: 'Lô hàng mặc định được tạo tự động để chuẩn hóa dữ liệu tồn kho cũ'
    });

    res.json({ success: true, message: 'Đã chuẩn hóa dữ liệu lô hàng thành công' });
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
  updateBatchLocation,
  normalizeProductBatches,
  getBranchStock
};
