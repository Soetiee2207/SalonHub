const db = require('../models');

// Get all branches
const getAllBranches = async (req, res, next) => {
  try {
    const branches = await db.Branch.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

// Get branch by ID with staff members
const getBranchById = async (req, res, next) => {
  try {
    const branch = await db.Branch.findByPk(req.params.id, {
      include: [
        {
          model: db.User,
          as: 'staff',
          attributes: { exclude: ['password'] },
        },
      ],
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// Create branch (admin only)
const createBranch = async (req, res, next) => {
  try {
    const { name, address, phone, openTime, closeTime } = req.body;

    const branchData = { name, address, phone, openTime, closeTime };

    if (req.file) {
      branchData.image = req.file.path;
    }

    const branch = await db.Branch.create(branchData);

    res.status(201).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// Update branch (admin only)
const updateBranch = async (req, res, next) => {
  try {
    const branch = await db.Branch.findByPk(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found.',
      });
    }

    const { name, address, phone, openTime, closeTime } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (openTime !== undefined) updateData.openTime = openTime;
    if (closeTime !== undefined) updateData.closeTime = closeTime;

    if (req.file) {
      updateData.image = req.file.path;
    }

    await branch.update(updateData);

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// Delete branch (admin only)
const deleteBranch = async (req, res, next) => {
  try {
    const branch = await db.Branch.findByPk(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found.',
      });
    }

    await branch.destroy();

    res.status(200).json({
      success: true,
      data: { message: 'Branch deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};
