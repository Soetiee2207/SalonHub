const { Op } = require('sequelize');
const db = require('../models');
const { Product, ProductCategory, ProductReview, sequelize } = db;
const redis = require('../config/redis');

// Helper to clear products cache
const clearProductsCache = async () => {
  if (!redis) return;
  try {
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(keys);
      console.log('🧹 [Redis] Products cache cleared.');
    }
  } catch (err) {
    console.error('❌ Redis Clear Error:', err.message);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const { categoryId, search, sort } = req.query;

    const where = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'price_asc') {
      order = [['price', 'ASC']];
    } else if (sort === 'price_desc') {
      order = [['price', 'DESC']];
    } else if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: ProductCategory, as: 'category' },
        { model: db.ProductBatch, as: 'batches' },
      ],
      order,
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: ProductCategory, as: 'category' },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const ratingData = await ProductReview.findOne({
      where: { productId: id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
      ],
      raw: true,
    });

    const productData = product.toJSON();
    productData.averageRating = ratingData.averageRating
      ? parseFloat(parseFloat(ratingData.averageRating).toFixed(1))
      : 0;
    productData.reviewCount = parseInt(ratingData.reviewCount) || 0;

    res.json({
      success: true,
      data: productData,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, categoryId } = req.body;
    const image = req.file ? req.file.path : null;

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      stock: 0,
      categoryId: categoryId === '' ? null : categoryId,
      image,
    });

    await clearProductsCache();

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('LỖI TẠO SẢN PHẨM:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId, isActive } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (categoryId !== undefined) updateData.categoryId = categoryId === '' ? null : categoryId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (req.file) updateData.image = req.file.path;

    await product.update(updateData);
    await clearProductsCache();

    const result = await Product.findByPk(id, {
      include: [{ model: ProductCategory, as: 'category' }],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    await product.update({ isActive: false });
    await clearProductsCache();

    res.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await ProductCategory.findAll({
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const category = await ProductCategory.create({ name, description });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await ProductCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await category.update(updateData);

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const category = await ProductCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const products = await Product.findAll({ where: { categoryId: id }, attributes: ['id'], transaction });
    const productIds = products.map(p => p.id);

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    try {
      if (productIds.length > 0) {
        const queries = [
          `DELETE FROM order_items WHERE productId IN (${productIds.join(',')})`,
          `DELETE FROM carts WHERE productId IN (${productIds.join(',')})`,
          `DELETE FROM product_reviews WHERE productId IN (${productIds.join(',')})`,
          `DELETE FROM inventory_transactions WHERE productId IN (${productIds.join(',')})`,
          `DELETE FROM product_batches WHERE productId IN (${productIds.join(',')})`,
          `DELETE FROM products WHERE id IN (${productIds.join(',')})`
        ];
        for (const q of queries) {
          await db.sequelize.query(q, { transaction });
        }
      }

      await db.sequelize.query(`DELETE FROM product_categories WHERE id = ${id}`, { transaction });

      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      await transaction.commit();
      await clearProductsCache();

      res.json({
        success: true,
        message: `Đã xóa danh mục và ${productIds.length} sản phẩm liên quan thành công.`,
      });
    } catch (innerError) {
      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      throw innerError;
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

const bulkDeleteProducts = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ.' });
    }

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    try {
      const queries = [
        `DELETE FROM order_items WHERE productId IN (${ids.join(',')})`,
        `DELETE FROM carts WHERE productId IN (${ids.join(',')})`,
        `DELETE FROM product_reviews WHERE productId IN (${ids.join(',')})`,
        `DELETE FROM inventory_transactions WHERE productId IN (${ids.join(',')})`,
        `DELETE FROM product_batches WHERE productId IN (${ids.join(',')})`,
        `DELETE FROM products WHERE id IN (${ids.join(',')})`
      ];

      for (const q of queries) {
        await db.sequelize.query(q, { transaction });
      }

      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      await transaction.commit();
      await clearProductsCache();

      res.status(200).json({
        success: true,
        message: `Đã xóa vĩnh viễn ${ids.length} sản phẩm thành công.`,
      });
    } catch (innerError) {
      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      throw innerError;
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
