const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 5000; // Ưu tiên lấy Port của Render, nếu không có mới dùng 8000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Sync database and start server
db.sequelize
  .sync()
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err.message);
    process.exit(1);
  });
