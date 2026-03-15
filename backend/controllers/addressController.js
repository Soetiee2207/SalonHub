const { Address } = require('../models');

const getMyAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const { fullName, phone, provinceCode, provinceName, districtCode, districtName, wardCode, wardName, street, isDefault } = req.body;

    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    }

    const existingCount = await Address.count({ where: { userId: req.user.id } });
    const address = await Address.create({
      userId: req.user.id,
      fullName,
      phone,
      provinceCode,
      provinceName,
      districtCode,
      districtName,
      wardCode,
      wardName,
      street,
      isDefault: isDefault || existingCount === 0,
    });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    const { fullName, phone, provinceCode, provinceName, districtCode, districtName, wardCode, wardName, street, isDefault } = req.body;

    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    }

    await address.update({ fullName, phone, provinceCode, provinceName, districtCode, districtName, wardCode, wardName, street, isDefault: isDefault !== undefined ? isDefault : address.isDefault });

    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    const wasDefault = address.isDefault;
    await address.destroy();

    if (wasDefault) {
      const firstAddress = await Address.findOne({ where: { userId: req.user.id }, order: [['createdAt', 'ASC']] });
      if (firstAddress) {
        await firstAddress.update({ isDefault: true });
      }
    }

    res.json({ success: true, message: 'Đã xóa địa chỉ' });
  } catch (error) {
    next(error);
  }
};

const setDefault = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    await address.update({ isDefault: true });

    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyAddresses, createAddress, updateAddress, deleteAddress, setDefault };
