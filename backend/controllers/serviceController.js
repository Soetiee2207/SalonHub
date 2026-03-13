const db = require('../models');
const { Op } = require('sequelize');

// Get all active services
const getAllServices = async (req, res, next) => {
  try {
    const { categoryId, search } = req.query;

    const where = { isActive: true };

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

// Get service by ID
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

// Create service (admin only)
const createService = async (req, res, next) => {
  try {
    const { name, description, price, duration, categoryId } = req.body;

    const serviceData = { name, description, price, duration, categoryId };

    if (req.file) {
      serviceData.image = req.file.path;
    }

    const service = await db.Service.create(serviceData);

    const serviceWithCategory = await db.Service.findByPk(service.id, {
      include: [{ model: db.ServiceCategory, as: 'category' }],
    });

    res.status(201).json({
      success: true,
      data: serviceWithCategory,
    });
  } catch (error) {
    next(error);
  }
};

// Update service (admin only)
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
    if (categoryId !== undefined) updateData.categoryId = categoryId;
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

// Delete service - soft delete (admin only)
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

// Get all service categories
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

// Create service category (admin only)
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

// Update service category (admin only)
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

// Delete service category (admin only)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await db.ServiceCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      data: { message: 'Category deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
