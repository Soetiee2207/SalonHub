const { Op } = require('sequelize');
const db = require('../models');
const { Product, ProductCategory, ProductReview, sequelize } = db;

// Get all active products with category
const getAllProducts = async (req, res, next) => {
  try {
    const { categoryId, search, sort } = req.query;

    const where = { isActive: true };

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

// Get single product with category + average rating
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

// Create product (admin only)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, categoryId } = req.body;
    const image = req.file ? req.file.path : null;

    const product = await Product.create({
      name,
      description,
      price,
      stock: stock || 0,
      categoryId,
      image,
    });

    const result = await Product.findByPk(product.id, {
      include: [{ model: ProductCategory, as: 'category' }],
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update product (admin only)
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
    if (stock !== undefined) updateData.stock = stock;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (req.file) updateData.image = req.file.path;

    await product.update(updateData);

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

// Delete product (soft delete)
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

    res.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Get all product categories
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

// Create product category (admin only)
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

// Update product category (admin only)
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

// Delete product category (admin only)
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await ProductCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
