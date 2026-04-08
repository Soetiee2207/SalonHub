const app = require('./app');
const db = require('./models');

// Port 10000 là chuẩn của Render
const PORT = process.env.PORT || 10000; 

// Chỉ chạy server sau khi đã kết nối Database thành công
db.sequelize
  .sync()
  .then(() => {
    console.log('✅ Success: Database synced successfully.');
    console.log(`📡 Connecting to: ${process.env.DB_HOST || 'local TiDB/MySQL'}`);
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🔗 API Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Error: Failed to sync database!');
    console.error('Diagnostic Message:', err.message);
    process.exit(1);
  });