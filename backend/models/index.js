const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/database');


let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true 
      },
      charset: 'utf8mb4',
      connectTimeout: 10000,
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false
  });
} else {
  sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: {
      charset: 'utf8mb4'
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    pool: dbConfig.pool,
    logging: dbConfig.logging,
  });
}


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
const InventoryTransaction = require('./InventoryTransaction')(sequelize, DataTypes);
const ProductBatch = require('./ProductBatch')(sequelize, DataTypes);
const CashFlowTransaction = require('./CashFlowTransaction')(sequelize, DataTypes);
const RefundRequest = require('./RefundRequest')(sequelize, DataTypes);
const CustomerServiceNote = require('./CustomerServiceNote')(sequelize, DataTypes);
const ReturnRequest = require('./ReturnRequest')(sequelize, DataTypes);
const OtpCode = require('./OtpCode')(sequelize, DataTypes);



User.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Branch.hasMany(User, { foreignKey: 'branchId', as: 'staff' });

Service.belongsTo(ServiceCategory, { foreignKey: 'categoryId', as: 'category' });
ServiceCategory.hasMany(Service, { foreignKey: 'categoryId', as: 'services' });

Product.belongsTo(ProductCategory, { foreignKey: 'categoryId', as: 'category' });
ProductCategory.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

Appointment.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
Appointment.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });
Appointment.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
User.hasMany(Appointment, { foreignKey: 'userId', as: 'appointments' });
User.hasMany(Appointment, { foreignKey: 'staffId', as: 'staffAppointments' });
Branch.hasMany(Appointment, { foreignKey: 'branchId', as: 'appointments' });
Service.hasMany(Appointment, { foreignKey: 'serviceId', as: 'appointments' });

Order.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
Order.belongsTo(Voucher, { foreignKey: 'voucherId', as: 'voucher' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Voucher.hasMany(Order, { foreignKey: 'voucherId', as: 'orders' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });

Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Cart.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(Cart, { foreignKey: 'userId', as: 'cartItems' });
Product.hasMany(Cart, { foreignKey: 'productId', as: 'cartItems' });

Review.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
Review.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });
Review.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
User.hasMany(Review, { foreignKey: 'staffId', as: 'staffReviews' });
Appointment.hasMany(Review, { foreignKey: 'appointmentId', as: 'reviews' });

ProductReview.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ProductReview.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(ProductReview, { foreignKey: 'userId', as: 'productReviews' });
Product.hasMany(ProductReview, { foreignKey: 'productId', as: 'reviews' });

Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Appointment.hasMany(Payment, { foreignKey: 'appointmentId', as: 'payments' });

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

StaffSchedule.belongsTo(User, { foreignKey: 'userId', as: 'staff' });
StaffSchedule.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
User.hasMany(StaffSchedule, { foreignKey: 'userId', as: 'schedules' });
Branch.hasMany(StaffSchedule, { foreignKey: 'branchId', as: 'schedules' });

StaffSkill.belongsTo(User, { foreignKey: 'userId', as: 'staff' });
StaffSkill.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
User.hasMany(StaffSkill, { foreignKey: 'userId', as: 'skills' });
Service.hasMany(StaffSkill, { foreignKey: 'serviceId', as: 'skilledStaff' });

User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.belongsToMany(Service, { through: StaffSkill, foreignKey: 'userId', otherKey: 'serviceId', as: 'skilledServices' });
Service.belongsToMany(User, { through: StaffSkill, foreignKey: 'serviceId', otherKey: 'userId', as: 'skilledStaffMembers' });

InventoryTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
InventoryTransaction.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
InventoryTransaction.belongsTo(ProductBatch, { foreignKey: 'batchId', as: 'batch' });
Product.hasMany(InventoryTransaction, { foreignKey: 'productId', as: 'inventoryTransactions' });
User.hasMany(InventoryTransaction, { foreignKey: 'createdBy', as: 'inventoryActions' });
ProductBatch.hasMany(InventoryTransaction, { foreignKey: 'batchId', as: 'inventoryTransactions' });

ProductBatch.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(ProductBatch, { foreignKey: 'productId', as: 'batches' });

InventoryTransaction.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Branch.hasMany(InventoryTransaction, { foreignKey: 'branchId', as: 'inventoryTransactions' });
ProductBatch.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Branch.hasMany(ProductBatch, { foreignKey: 'branchId', as: 'productBatches' });

Payment.belongsTo(User, { as: 'reconciler', foreignKey: 'reconciledBy' });
CashFlowTransaction.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
CashFlowTransaction.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Branch.hasMany(CashFlowTransaction, { foreignKey: 'branchId', as: 'cashFlowTransactions' });
RefundRequest.belongsTo(User, { as: 'processor', foreignKey: 'processedBy' });

RefundRequest.belongsTo(Order, { foreignKey: 'targetId', constraints: false, as: 'order' });
RefundRequest.belongsTo(Appointment, { foreignKey: 'targetId', constraints: false, as: 'appointment' });
Order.hasMany(RefundRequest, { foreignKey: 'targetId', as: 'refunds', constraints: false });
Appointment.hasMany(RefundRequest, { foreignKey: 'targetId', as: 'refunds', constraints: false });

Appointment.belongsTo(Order, { as: 'upsellOrder', foreignKey: 'orderId' });
Order.hasOne(Appointment, { as: 'parentAppointment', foreignKey: 'orderId' });

CustomerServiceNote.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
CustomerServiceNote.belongsTo(User, { as: 'staff', foreignKey: 'staffId' });
CustomerServiceNote.belongsTo(Appointment, { as: 'appointment', foreignKey: 'appointmentId' });
Appointment.hasMany(CustomerServiceNote, { as: 'notes', foreignKey: 'appointmentId' });
User.hasMany(CustomerServiceNote, { as: 'notesAsCustomer', foreignKey: 'customerId' });
User.hasMany(CustomerServiceNote, { as: 'notesAsStaff', foreignKey: 'staffId' });

ReturnRequest.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
ReturnRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.hasOne(ReturnRequest, { foreignKey: 'orderId', as: 'returnRequest' });
User.hasMany(ReturnRequest, { foreignKey: 'userId', as: 'returnRequests' });


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
  InventoryTransaction,
  ProductBatch,
  CashFlowTransaction,
  RefundRequest,
  CustomerServiceNote,
  ReturnRequest,
  OtpCode,
};

module.exports = db;
