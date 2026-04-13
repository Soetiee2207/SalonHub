require('dotenv').config({ override: true });
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const db = require('./models');
const socketService = require('./services/socketService');

// Port 10000 là chuẩn của Render
const PORT = process.env.PORT || 10000; 

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      'https://salonhub-soe.vercel.app',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize our socket helper service
socketService.init(io);

// Store io in app to use in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log('📡 New client connected:', socket.id);

  // Join room based on userId (for private notifications)
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their private room.`);
  });

  // Join room based on role (for group notifications)
  socket.on('join_role', (role) => {
    socket.join(`role_${role}`);
    console.log(`👥 Client joined role room: role_${role}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Chỉ chạy server sau khi đã kết nối Database thành công
db.sequelize
  .sync()
  .then(() => {
    console.log('✅ Success: Database synced successfully.');
    console.log(`📡 Connecting to: ${process.env.DB_HOST || 'local TiDB/MySQL'}`);
    
    // Start deposit timeout job (auto-cancel expired deposits)
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
