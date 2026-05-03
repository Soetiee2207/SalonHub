module.exports = (sequelize, DataTypes) => {
  const OtpCode = sequelize.define('OtpCode', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('registration', 'password_reset'),
      allowNull: false,
      defaultValue: 'registration',
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'otp_codes',
  });

  return OtpCode;
};
