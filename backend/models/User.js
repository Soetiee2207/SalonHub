module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    role: {
      type: DataTypes.ENUM('customer', 'staff', 'admin', 'warehouse_staff', 'service_staff', 'accountant'),
      defaultValue: 'customer',
    },
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    workStatus: {
      type: DataTypes.ENUM('available', 'break', 'busy'),
      defaultValue: 'available',
    },
    rank: {
      type: DataTypes.ENUM('Silver', 'Gold', 'Diamond'),
      defaultValue: 'Silver',
    },
  }, {
    timestamps: true,
    tableName: 'users',
  });

  return User;
};
