module.exports = (sequelize, DataTypes) => {
  const StaffSkill = sequelize.define('StaffSkill', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'staff_skills',
  });

  return StaffSkill;
};
