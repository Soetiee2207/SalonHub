module.exports = (sequelize, DataTypes) => {
  const CashFlowTransaction = sequelize.define('CashFlowTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM('receipt', 'payment'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('utilities', 'rent', 'salary', 'supplier_payment', 'outside_income', 'refund', 'deposit', 'other'),
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM('cash', 'bank', 'vnpay', 'sepay'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'completed',
    },
    referenceType: {
      type: DataTypes.ENUM('order', 'appointment', 'inventory_import', 'manual'),
      defaultValue: 'manual',
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'cash_flow_transactions',
  });

  return CashFlowTransaction;
};
