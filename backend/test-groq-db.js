require('dotenv').config({ path: 'e:/Studying Document/A_2026_Work/K2N1-25.26/chuyen_de_tot_nghiep/SalonHub/backend/.env' });
const chatController = require('./controllers/chatController');
const db = require('./models');

async function test() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected');

    const req = { body: { message: "Giá cắt tóc nam là bao nhiêu?" } };
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log(`Status: ${this.statusCode}`);
        console.log(`Response:`, JSON.stringify(data, null, 2));
      }
    };

    await chatController.askChatbot(req, res);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
