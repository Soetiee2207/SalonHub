const app = require('./app');
const db = require('./models');

// Quan trọng: Phải load config này đầu tiên nếu app.js chưa có
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Chỉ Sync database rồi mới chạy server một lần duy nhất
db.sequelize
  .sync()
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err.message);
    process.exit(1);
  });