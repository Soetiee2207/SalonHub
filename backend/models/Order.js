module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('cod', 'vnpay'),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending',
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    voucherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
  }, {
    timestamps: true,
    tableName: 'orders',
  });

  return Order;
};
