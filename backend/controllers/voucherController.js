const db = require('../models');
const { Op } = require('sequelize');

// Get all vouchers
const getAllVouchers = async (req, res, next) => {
  try {
    let where = {};

    // If not admin, only show active and valid date vouchers
    if (!req.user || req.user.role !== 'admin') {
      const today = new Date().toISOString().split('T')[0];
      where = {
        isActive: true,
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
      };
    }

    const vouchers = await db.Voucher.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    next(error);
  }
};

// Get voucher by code (public)
const getVoucherByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const voucher = await db.Voucher.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found.',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const isValid =
      voucher.isActive &&
      voucher.startDate <= today &&
      voucher.endDate >= today &&
      (voucher.usageLimit === null || voucher.usedCount < voucher.usageLimit);

    res.status(200).json({
      success: true,
      data: {
        ...voucher.toJSON(),
        isValid,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create voucher (admin only)
const createVoucher = async (req, res, next) => {
  try {
    const {
      code,
      discount,
      discountType,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = req.body;

    // Check if code already exists
    const existingVoucher = await db.Voucher.findOne({
      where: { code: code.toUpperCase() },
    });

    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code already exists.',
      });
    }

    const voucher = await db.Voucher.create({
      code: code.toUpperCase(),
      discount,
      discountType,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || null,
      startDate,
      endDate,
      usageLimit: usageLimit || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

// Update voucher (admin only)
const updateVoucher = async (req, res, next) => {
  try {
    const voucher = await db.Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found.',
      });
    }

    const {
      code,
      discount,
      discountType,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = req.body;

    const updateData = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (discount !== undefined) updateData.discount = discount;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (minOrderValue !== undefined) updateData.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (isActive !== undefined) updateData.isActive = isActive;

    await voucher.update(updateData);

    res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

// Delete voucher (admin only)
const deleteVoucher = async (req, res, next) => {
  try {
    const voucher = await db.Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found.',
      });
    }

    await voucher.destroy();

    res.status(200).json({
      success: true,
      data: { message: 'Voucher deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

// Validate voucher for order amount
const validateVoucher = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || orderAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code and order amount are required.',
      });
    }

    const voucher = await db.Voucher.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found.',
      });
    }

    const today = new Date().toISOString().split('T')[0];

    if (!voucher.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Voucher is not active.',
      });
    }

    if (voucher.startDate > today || voucher.endDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Voucher is not within valid date range.',
      });
    }

    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Voucher usage limit has been reached.',
      });
    }

    if (parseFloat(orderAmount) < parseFloat(voucher.minOrderValue)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value is ${voucher.minOrderValue}.`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === 'percent') {
      discountAmount = (parseFloat(orderAmount) * parseFloat(voucher.discount)) / 100;
      if (voucher.maxDiscount && discountAmount > parseFloat(voucher.maxDiscount)) {
        discountAmount = parseFloat(voucher.maxDiscount);
      }
    } else {
      discountAmount = parseFloat(voucher.discount);
    }

    // Discount should not exceed order amount
    if (discountAmount > parseFloat(orderAmount)) {
      discountAmount = parseFloat(orderAmount);
    }

    res.status(200).json({
      success: true,
      data: {
        voucherId: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discount: voucher.discount,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalAmount: parseFloat((parseFloat(orderAmount) - discountAmount).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVouchers,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
};
