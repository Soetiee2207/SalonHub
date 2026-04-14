const nodemailer = require('nodemailer');

// ⚠️ Sử dụng OAuth2 cho Gmail chuyên nghiệp và bảo mật
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.SMTP_USER,
    clientId: process.env.GOOGLE_MAIL_CLIENT_ID,
    clientSecret: process.env.GOOGLE_MAIL_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_MAIL_REFRESH_TOKEN,
  },
});

/**
 * Gửi email chung sử dụng OAuth2
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'SalonHub'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent via OAuth2: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Send email OAuth2 error:', error);
    // Báo lỗi chi tiết hơn nếu là lỗi xác thực OAuth2
    if (error.code === 'EAUTH') {
      throw new Error('Lỗi xác thực email (OAuth2). Vui lòng kiểm tra cấu hình token.');
    }
    throw new Error('Không thể gửi email xác thực. Vui lòng thử lại sau.');
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
