const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 10000; // Render dùng port 10000

db.sequelize
  .sync()
  .then(() => {
    console.log('Database synced successfully.');
    // CHỈ GỌI LỆNH NÀY 1 LẦN DUY NHẤT Ở ĐÂY
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err.message);
    process.exit(1);
  });