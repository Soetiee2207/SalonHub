const express = require('express');
const cors = require('cors'); // Nhớ khai báo ở trên đầu
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const branchRoutes = require('./routes/branchRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const staffRoutes = require('./routes/staffRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const addressRoutes = require('./routes/addressRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const staffScheduleRoutes = require('./routes/staffScheduleRoutes');
const customerRoutes = require('./routes/customerRoutes');
const accountantRoutes = require('./routes/accountantRoutes');

const app = express();




// PHẢI ĐẶT TRƯỚC TẤT CẢ CÁC ROUTES
app.use(cors({
  origin: function (origin, callback) {
    // Cho phép: localhost, các link có đuôi .vercel.app và cả khi không có origin (như Postman)
    if (!origin || origin.startsWith('http://localhost') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Đảm bảo có dòng này để đọc được body từ request POST (đăng nhập)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/schedules', staffScheduleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/accountant', accountantRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SalonHub API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
