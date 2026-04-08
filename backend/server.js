const app = require('./app');
const db = require('./models');

// Port 10000 là chuẩn của Render
const PORT = process.env.PORT || 10000; 

// Chỉ chạy server sau khi đã kết nối Database thành công
db.sequelize
  .sync()
  .then(() => {
    console.log('Database synced successfully.');
    // CHỈ GỌI LỆNH NÀY DUY NHẤT MỘT LẦN TẠI ĐÂY
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err.message);
    process.exit(1);
  });