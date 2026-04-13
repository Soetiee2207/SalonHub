module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('awaiting_deposit', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'awaiting_deposit',
    },
    depositAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    depositStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
  }, {
    timestamps: true,
    tableName: 'appointments',
  });

  return Appointment;
};
