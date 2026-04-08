module.exports = (sequelize, DataTypes) => {
  const InventoryTransaction = sequelize.define('InventoryTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // import: nhập hàng vào kho
    // export: xuất hàng (bán, sử dụng cho dịch vụ, hỏng hóc)
    // adjust: điều chỉnh thủ công
    type: {
      type: DataTypes.ENUM('import', 'export', 'adjust'),
      allowNull: false,
    },
    // Số lượng thay đổi (luôn dương, type xác định chiều)
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    // Số tồn kho TRƯỚC khi thực hiện giao dịch (snapshot)
    stockBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Số tồn kho SAU khi thực hiện giao dịch (snapshot)
    stockAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Ghi chú / lý do giao dịch
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Loại nguồn tham chiếu: 'order', 'manual', 'appointment'
    referenceType: {
      type: DataTypes.ENUM('order', 'manual', 'appointment'),
      allowNull: true,
    },
    // ID của đơn hàng / lịch hẹn liên quan (nếu có)
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Người thực hiện giao dịch
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'inventory_transactions',
  });

  return InventoryTransaction;
};
