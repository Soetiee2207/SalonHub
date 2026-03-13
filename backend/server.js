const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 5000;

// Sync database and start server
db.sequelize
  .sync({ alter: true })
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
