const { google } = require('googleapis');

// Xây dựng email theo chuẩn MIME và mã hóa Base64URL cho Gmail API
const createEmailMessage = (to, subject, html) => {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `From: ${process.env.SMTP_FROM_NAME || 'SalonHub'} <${process.env.SMTP_USER}>`,
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    html,
  ];
  const message = messageParts.join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Gửi email sử dụng Gmail REST API (qua cổng Web 443 - Không bị Render chặn)
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.GOOGLE_MAIL_REFRESH_TOKEN) {
      throw new Error('Thiếu cấu hình GOOGLE_MAIL_REFRESH_TOKEN');
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_MAIL_CLIENT_ID,
      process.env.GOOGLE_MAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    
    oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_MAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const rawMessage = createEmailMessage(to, subject, html);
    
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });

    console.log('✅ Email sent successfully via Gmail API:', res.data.id);
    return res.data;
  } catch (error) {
    console.error('❌ Send email error (Gmail API):', error.message);
    throw new Error(`Lỗi gửi email: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Gửi mã OTP xác thực đăng ký
 */
const sendOtpEmail = async (email, otpCode) => {
  const subject = `[SalonHub] Mã xác thực đăng ký tài khoản của bạn là ${otpCode}`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #5A3A24; margin: 0; font-size: 28px; letter-spacing: 1px;">SalonHub</h1>
        <p style="color: #8c7e74; font-size: 14px; margin-top: 5px;">Không gian tóc đẳng cấp</p>
      </div>
      
      <div style="padding: 20px; background-color: #fcfaf8; border-radius: 8px; border-left: 4px solid #5A3A24;">
        <h2 style="color: #333; font-size: 18px; margin-top: 0;">Xác thực tài khoản</h2>
        <p style="color: #555; line-height: 1.6;">Chào mừng bạn đến với SalonHub! Để hoàn tất việc đăng ký tài khoản, vui lòng sử dụng mã xác thực dưới đây:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; padding: 15px 40px; background-color: #5A3A24; color: #ffffff; font-size: 32px; font-weight: bold; border-radius: 8px; letter-spacing: 8px;">
            ${otpCode}
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 10px;">Mã này sẽ hết hạn sau 5 phút</p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 SalonHub. Hệ thống quản lý Salon chuyên nghiệp.</p>
        <p>Email: support@salonhub.vn | Hotline: 1900 xxxx</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
};
