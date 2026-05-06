const db = require('../models');
const { Op } = require('sequelize');

// Get all customers (CRM List)
const getAllCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { role: 'customer' };

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const customers = await db.User.findAll({
      where,
      attributes: {
        exclude: ['password'],
        include: [
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM appointments AS appt
              WHERE appt.userId = User.id AND appt.status = 'completed'
            )`),
            'appointmentCount'
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM orders AS ord
              WHERE ord.userId = User.id
            )`),
            'orderCount'
          ],
          [
            db.sequelize.literal(`(
              SELECT COALESCE(SUM(totalPrice), 0)
              FROM appointments AS appt
              WHERE appt.userId = User.id AND appt.status = 'completed'
            )`),
            'totalServiceSpend'
          ],
          [
             db.sequelize.literal(`(
              SELECT COALESCE(SUM(totalAmount), 0)
              FROM orders AS ord
              WHERE ord.userId = User.id AND ord.status IN ('delivered', 'completed')
            )`),
            'totalProductSpend'
          ]
        ]
      },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// Get single customer details with history
const getCustomerDetails = async (req, res, next) => {
  try {
    const customer = await db.User.findOne({
      where: { id: req.params.id, role: 'customer' },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Appointment,
          as: 'appointments',
          include: [
            { model: db.Service, as: 'service' },
            { model: db.User, as: 'staff', attributes: ['fullName'] },
            { model: db.Branch, as: 'branch' }
          ]
        },
        {
          model: db.Order,
          as: 'orders',
          include: [
            { 
               model: db.OrderItem, 
               as: 'items',
               include: [{ model: db.Product, as: 'product' }]
            }
          ]
        },
        { model: db.Address, as: 'addresses' }
      ],
      order: [
        [{ model: db.Appointment, as: 'appointments' }, 'date', 'DESC'],
        [{ model: db.Order, as: 'orders' }, 'createdAt', 'DESC']
      ]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// Update customer details (CRM Correction)
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await db.User.findOne({
      where: { id: req.params.id, role: 'customer' },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const { fullName, phone, loyaltyPoints, rank } = req.body;
    await customer.update({ fullName, phone, loyaltyPoints, rank });

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle customer status (Lock/Unlock)
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await db.User.findOne({
      where: { id: req.params.id, role: 'customer' },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    await customer.update({ isActive: !customer.isActive });

    res.status(200).json({
      success: true,
      message: customer.isActive ? 'Tài khoản đã được mở khóa' : 'Tài khoản đã bị khóa',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// Delete customer (Data Cleanup)
const deleteCustomer = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const customer = await db.User.findOne({
      where: { id, role: 'customer' },
      transaction
    });

    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    // Delete associated data first to avoid FK constraints
    await db.Address.destroy({ where: { userId: id }, transaction });
    await db.Review.destroy({ where: { userId: id }, transaction });
    await db.OtpCode.destroy({ where: { email: customer.email }, transaction });
    
    // Also delete appointments and orders if cleaning up
    await db.Appointment.destroy({ where: { userId: id }, transaction });
    await db.Order.destroy({ where: { userId: id }, transaction });
    
    // Finally delete the user
    await customer.destroy({ transaction });

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: 'Đã xóa tài khoản khách hàng và các dữ liệu liên quan thành công.',
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerDetails,
  updateCustomer,
  toggleCustomerStatus,
  deleteCustomer,
};
