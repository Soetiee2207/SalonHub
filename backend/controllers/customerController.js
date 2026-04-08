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

module.exports = {
  getAllCustomers,
  getCustomerDetails,
  updateCustomer,
};
