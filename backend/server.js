require('dotenv').config({ override: true });
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const db = require('./models');
const socketService = require('./services/socketService');

const PORT = process.env.PORT || 10000; 

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'https://salonhub-soe.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'https://salonhub-3cg8.onrender.com', // Địa chỉ Backend của bạn (đôi khi cần thiết)
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

socketService.init(io);

app.set('io', io);

io.on('connection', (socket) => {
  console.log('📡 New client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their private room.`);
  });

  socket.on('join_role', (role) => {
    socket.join(`role_${role}`);
    console.log(`👥 Client joined role room: role_${role}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

async function runMigrations() {
  const qi = db.sequelize.getQueryInterface();
  const tableDesc = await qi.describeTable('users');

  if (!tableDesc.isEmailVerified) {
    await db.sequelize.query('ALTER TABLE `users` ADD COLUMN `isEmailVerified` TINYINT(1) DEFAULT 0;');
    console.log('🔧 Migration: Added column isEmailVerified to users');
  }
  if (!tableDesc.isActive) {
    await db.sequelize.query('ALTER TABLE `users` ADD COLUMN `isActive` TINYINT(1) DEFAULT 1;');
    console.log('🔧 Migration: Added column isActive to users');
  }

  try {
    const invDesc = await qi.describeTable('inventory_transactions');
    if (!invDesc.branchId) {
      await db.sequelize.query('ALTER TABLE `inventory_transactions` ADD COLUMN `branchId` INT DEFAULT NULL;');
      console.log('🔧 Migration: Added column branchId to inventory_transactions');
    }
  } catch (e) { /* Table may not exist yet */ }

  try {
    const batchDesc = await qi.describeTable('product_batches');
    if (!batchDesc.branchId) {
      await db.sequelize.query('ALTER TABLE `product_batches` ADD COLUMN `branchId` INT DEFAULT NULL;');
      console.log('🔧 Migration: Added column branchId to product_batches');
    }
  } catch (e) { /* Table may not exist yet */ }

  try {
    const otpDesc = await qi.describeTable('otp_codes');
    if (!otpDesc.payload) {
      await db.sequelize.query('ALTER TABLE `otp_codes` ADD COLUMN `payload` TEXT DEFAULT NULL;');
      console.log('🔧 Migration: Added column payload to otp_codes');
    }
  } catch (e) { /* Table may not exist yet */ }

  try {
    const cashDesc = await qi.describeTable('cash_flow_transactions');
    if (!cashDesc.branchId) {
      await db.sequelize.query('ALTER TABLE `cash_flow_transactions` ADD COLUMN `branchId` INT DEFAULT NULL;');
      console.log('🔧 Migration: Added column branchId to cash_flow_transactions');
    }
  } catch (e) { /* Table may not exist yet */ }
}

db.sequelize
  .sync()
  .then(() => runMigrations())
  .then(() => {
    console.log('✅ Success: Database synced successfully.');
    console.log(`📡 Connecting to: ${process.env.DB_HOST || 'local TiDB/MySQL'}`);
    
    const { startDepositTimeoutJob } = require('./services/depositTimeoutJob');
    startDepositTimeoutJob();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT} (0.0.0.0)`);
      console.log(`🔗 API Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Error: Failed to sync database!');
    console.error('Diagnostic Message:', err.message);
    process.exit(1);
  });
