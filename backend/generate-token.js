const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_MAIL_CLIENT_ID,
  process.env.GOOGLE_MAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // URI bắt buộc
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://mail.google.com/'],
  prompt: 'consent'
});

console.log('====================================================');
console.log('1. Hãy mở đường link này trong trình duyệt của bạn:');
console.log(authUrl);
console.log('====================================================');
console.log('2. Đăng nhập bằng tài khoản Google của bạn và bấm Cho phép (Allow).');
console.log('3. Trình duyệt sẽ chuyển hướng tới một trang báo lỗi (không sao cả) HOẶC trang OAuth Playground.');
console.log('4. Nhìn lên thanh địa chỉ trình duyệt, copy đoạn mã code="..." (chỉ copy phần sau dấu = và trước dấu & nếu có).');
console.log('----------------------------------------------------');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('👉 Hãy dán mã CODE bạn vừa copy vào đây: ', async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('\n✅ THÀNH CÔNG! Dưới đây là Refresh Token mới của bạn:');
    console.log('----------------------------------------------------');
    console.log(tokens.refresh_token);
    console.log('----------------------------------------------------');
    console.log('Hãy copy dòng trên và dán vào biến GOOGLE_MAIL_REFRESH_TOKEN trên Render nhé!');
  } catch (error) {
    console.error('❌ Lỗi khi lấy token:', error.message);
    console.log('Gợi ý: Đảm bảo bạn copy đúng đoạn mã code (không thừa khoảng trắng).');
  }
  rl.close();
});
