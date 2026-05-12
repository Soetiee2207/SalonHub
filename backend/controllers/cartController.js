const db = require('../models');
const { Cart, Product, ProductCategory } = db;

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          include: [{ model: ProductCategory, as: 'category' }],
        },
      ],
    });

    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        items: cartItems,
        total: parseFloat(total.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    let cartItem = await Cart.findOne({
      where: { userId, productId },
    });

    const requestedQty = cartItem ? cartItem.quantity + quantity : quantity;

    if (requestedQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}.`,
      });
    }

    if (cartItem) {
      await cartItem.update({ quantity: requestedQty });
    } else {
      cartItem = await Cart.create({ userId, productId, quantity });
    }

    const result = await Cart.findByPk(cartItem.id, {
      include: [
        {
          model: Product,
          as: 'product',
          include: [{ model: ProductCategory, as: 'category' }],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    const cartItem = await Cart.findOne({
      where: { id, userId },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    const product = await Product.findByPk(cartItem.productId);
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}.`,
      });
    }

    await cartItem.update({ quantity });

    const result = await Cart.findByPk(cartItem.id, {
      include: [
        {
          model: Product,
          as: 'product',
          include: [{ model: ProductCategory, as: 'category' }],
        },
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

const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cartItem = await Cart.findOne({
      where: { id, userId },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    await cartItem.destroy();

    res.json({
      success: true,
      message: 'Item removed from cart.',
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Cart.destroy({ where: { userId } });

    res.json({
      success: true,
      message: 'Cart cleared successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
