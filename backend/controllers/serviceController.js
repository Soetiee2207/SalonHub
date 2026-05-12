const db = require('../models');
const { Op } = require('sequelize');

const getAllServices = async (req, res, next) => {
  try {
    const { categoryId, search } = req.query;

    const where = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const services = await db.Service.findAll({
      where,
      include: [{ model: db.ServiceCategory, as: 'category' }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const service = await db.Service.findByPk(req.params.id, {
      include: [{ model: db.ServiceCategory, as: 'category' }],
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { name, description, price, duration, categoryId } = req.body;

    const serviceData = { 
      name, 
      description, 
      price: Number(price), 
      duration: Number(duration), 
      categoryId: categoryId === '' ? null : categoryId 
    };

    if (req.file) {
      serviceData.image = req.file.path;
    }

    const service = await db.Service.create(serviceData);

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('LỖI TẠO DỊCH VỤ:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateService = async (req, res, next) => {
  try {
    const service = await db.Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const { name, description, price, duration, categoryId, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (duration !== undefined) updateData.duration = duration;
    if (categoryId !== undefined) updateData.categoryId = categoryId === '' ? null : categoryId;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (req.file) {
      updateData.image = req.file.path;
    }

    await service.update(updateData);

    const updatedService = await db.Service.findByPk(service.id, {
      include: [{ model: db.ServiceCategory, as: 'category' }],
    });

    res.status(200).json({
      success: true,
      data: updatedService,
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const service = await db.Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    await service.update({ isActive: false });

    res.status(200).json({
      success: true,
      data: { message: 'Service deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await db.ServiceCategory.findAll({
      order: [['name', 'ASC']],
    });

    res.status(200).json({
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

    const category = await db.ServiceCategory.create({ name, description });

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
    const category = await db.ServiceCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const { name, description } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await category.update(updateData);

    res.status(200).json({
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

    const category = await db.ServiceCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const services = await db.Service.findAll({ where: { categoryId: id }, attributes: ['id'], transaction });
    const serviceIds = services.map(s => s.id);

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    try {
      if (serviceIds.length > 0) {
        const queries = [
          `DELETE FROM payments WHERE appointmentId IN (SELECT id FROM appointments WHERE serviceId IN (${serviceIds.join(',')}))`,
          `DELETE FROM customer_service_notes WHERE appointmentId IN (SELECT id FROM appointments WHERE serviceId IN (${serviceIds.join(',')}))`,
          `DELETE FROM reviews WHERE appointmentId IN (SELECT id FROM appointments WHERE serviceId IN (${serviceIds.join(',')}))`,
          `DELETE FROM appointments WHERE serviceId IN (${serviceIds.join(',')})`,
          `DELETE FROM staff_skills WHERE serviceId IN (${serviceIds.join(',')})`,
          `DELETE FROM services WHERE id IN (${serviceIds.join(',')})`
        ];
        for (const q of queries) {
          await db.sequelize.query(q, { transaction });
        }
      }

      await db.sequelize.query(`DELETE FROM service_categories WHERE id = ${id}`, { transaction });

      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      await transaction.commit();

      res.status(200).json({
        success: true,
        message: `Đã xóa danh mục và ${serviceIds.length} dịch vụ liên quan thành công.`,
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

const bulkDeleteServices = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ.' });
    }

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    try {
      const queries = [
        `DELETE FROM payments WHERE appointmentId IN (SELECT id FROM appointments WHERE serviceId IN (${ids.join(',')}))`,
        `DELETE FROM customer_service_notes WHERE appointmentId IN (SELECT id FROM appointments WHERE serviceId IN (${ids.join(',')}))`,
        `DELETE FROM reviews WHERE appointmentId IN (SELECT id FROM appointments WHERE serviceId IN (${ids.join(',')}))`,
        `DELETE FROM appointments WHERE serviceId IN (${ids.join(',')})`,
        `DELETE FROM staff_skills WHERE serviceId IN (${ids.join(',')})`,
        `DELETE FROM services WHERE id IN (${ids.join(',')})`
      ];

      for (const q of queries) {
        await db.sequelize.query(q, { transaction });
      }

      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      await transaction.commit();

      res.status(200).json({
        success: true,
        message: `Đã xóa vĩnh viễn ${ids.length} dịch vụ thành công.`,
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
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  bulkDeleteServices,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
