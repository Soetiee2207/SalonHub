module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provinceCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provinceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    districtCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    districtName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    wardCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    wardName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    timestamps: true,
    tableName: 'addresses',
  });

  return Address;
};
