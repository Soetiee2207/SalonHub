const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/database');

const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
  logging: dbConfig.logging,
});

// Import models
const User = require('./User')(sequelize, DataTypes);
const Branch = require('./Branch')(sequelize, DataTypes);
const ServiceCategory = require('./ServiceCategory')(sequelize, DataTypes);
const Service = require('./Service')(sequelize, DataTypes);
const ProductCategory = require('./ProductCategory')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const Appointment = require('./Appointment')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const OrderItem = require('./OrderItem')(sequelize, DataTypes);
const Cart = require('./Cart')(sequelize, DataTypes);
const Review = require('./Review')(sequelize, DataTypes);
const ProductReview = require('./ProductReview')(sequelize, DataTypes);
const Voucher = require('./Voucher')(sequelize, DataTypes);
const Payment = require('./Payment')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const StaffSchedule = require('./StaffSchedule')(sequelize, DataTypes);
const StaffSkill = require('./StaffSkill')(sequelize, DataTypes);
const Address = require('./Address')(sequelize, DataTypes);

// ===================== ASSOCIATIONS =====================

// User <-> Branch
User.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Branch.hasMany(User, { foreignKey: 'branchId', as: 'staff' });

// Service <-> ServiceCategory
Service.belongsTo(ServiceCategory, { foreignKey: 'categoryId', as: 'category' });
ServiceCategory.hasMany(Service, { foreignKey: 'categoryId', as: 'services' });

// Product <-> ProductCategory
Product.belongsTo(ProductCategory, { foreignKey: 'categoryId', as: 'category' });
ProductCategory.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

// Appointment associations
Appointment.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
Appointment.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });
Appointment.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
User.hasMany(Appointment, { foreignKey: 'userId', as: 'appointments' });
User.hasMany(Appointment, { foreignKey: 'staffId', as: 'staffAppointments' });
Branch.hasMany(Appointment, { foreignKey: 'branchId', as: 'appointments' });
Service.hasMany(Appointment, { foreignKey: 'serviceId', as: 'appointments' });

// Order associations
Order.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
Order.belongsTo(Voucher, { foreignKey: 'voucherId', as: 'voucher' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Voucher.hasMany(Order, { foreignKey: 'voucherId', as: 'orders' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// OrderItem <-> Product
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });

// Cart associations
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Cart.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(Cart, { foreignKey: 'userId', as: 'cartItems' });
Product.hasMany(Cart, { foreignKey: 'productId', as: 'cartItems' });

// Review associations
Review.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
Review.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });
Review.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
User.hasMany(Review, { foreignKey: 'staffId', as: 'staffReviews' });
Appointment.hasMany(Review, { foreignKey: 'appointmentId', as: 'reviews' });

// ProductReview associations
ProductReview.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ProductReview.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(ProductReview, { foreignKey: 'userId', as: 'productReviews' });
Product.hasMany(ProductReview, { foreignKey: 'productId', as: 'reviews' });

// Payment associations
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Appointment.hasMany(Payment, { foreignKey: 'appointmentId', as: 'payments' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// StaffSchedule associations
StaffSchedule.belongsTo(User, { foreignKey: 'userId', as: 'staff' });
StaffSchedule.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
User.hasMany(StaffSchedule, { foreignKey: 'userId', as: 'schedules' });
Branch.hasMany(StaffSchedule, { foreignKey: 'branchId', as: 'schedules' });

// StaffSkill associations
StaffSkill.belongsTo(User, { foreignKey: 'userId', as: 'staff' });
StaffSkill.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
User.hasMany(StaffSkill, { foreignKey: 'userId', as: 'skills' });
Service.hasMany(StaffSkill, { foreignKey: 'serviceId', as: 'skilledStaff' });

// User <-> Address
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Many-to-Many: User <-> Service through StaffSkill
User.belongsToMany(Service, { through: StaffSkill, foreignKey: 'userId', otherKey: 'serviceId', as: 'skilledServices' });
Service.belongsToMany(User, { through: StaffSkill, foreignKey: 'serviceId', otherKey: 'userId', as: 'skilledStaffMembers' });

// ===================== EXPORT =====================

const db = {
  sequelize,
  Sequelize,
  User,
  Branch,
  ServiceCategory,
  Service,
  ProductCategory,
  Product,
  Appointment,
  Order,
  OrderItem,
  Cart,
  Review,
  ProductReview,
  Voucher,
  Payment,
  Notification,
  StaffSchedule,
  StaffSkill,
  Address,
};

module.exports = db;
