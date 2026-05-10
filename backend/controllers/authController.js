const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { OAuth2Client } = require('google-auth-library');
const emailService = require('../services/emailService');
const crypto = require('crypto');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register new customer account (Direct registration)
// @route   POST /api/auth/register
// @desc    Register new customer account (Request OTP)
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ Họ tên, Email và Mật khẩu.',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ.',
      });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({ 
      where: { 
        [db.Sequelize.Op.or]: [{ email }, { phone: phone || '' }] 
      } 
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email ? 'Email đã được đăng ký.' : 'Số điện thoại đã tồn tại trên hệ thống.',
      });
    }

    // Hash password before storing in payload
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store registration data in payload
    const payload = JSON.stringify({
      fullName,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: 'customer'
    });

    await db.OtpCode.create({
      email,
      code: otpCode,
      type: 'registration',
      expiresAt,
      payload
    });

    // Send verification email
    try {
      await emailService.sendOtpEmail(email, otpCode);
    } catch (emailError) {
      console.error('Lỗi gửi email (Có thể do Render chặn port 587):', emailError.message);
      console.log('==================================================');
      console.log(`[DEV MODE / RENDER FALLBACK] MÃ OTP CỦA ${email} LÀ: ${otpCode}`);
      console.log('==================================================');
      // Không throw lỗi ra ngoài để luồng đăng ký không bị đứt đoạn
    }

    return res.status(200).json({
      success: true,
      message: 'Mã xác thực đã được xử lý (Xem Render Logs nếu không nhận được mail).',
      data: { email },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error.',
    });
  }
};

// @desc    Verify OTP for registration and CREATE account
// @route   POST /api/auth/verify-registration-otp
const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mã xác thực.',
      });
    }

    // Find valid OTP
    const otpRecord = await db.OtpCode.findOne({
      where: {
        email,
        code: otp,
        type: 'registration',
        isUsed: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord || !otpRecord.payload) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực không đúng hoặc đã hết hạn.',
      });
    }

    // Extract registration data from payload
    const userDataToCreate = JSON.parse(otpRecord.payload);

    // Double check if user created by someone else in the meantime
    const existingUser = await db.User.findOne({ where: { email: userDataToCreate.email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email đã được đăng ký.' });
    }

    // 1. Create the official user account
    const user = await db.User.create({
      ...userDataToCreate,
      isEmailVerified: true
    });

    // 2. Mark OTP as used
    await otpRecord.update({ isUsed: true });

    // 3. Generate token for auto-login
    const token = generateToken(user);
    const userData = user.toJSON();
    delete userData.password;

    return res.status(201).json({
      success: true,
      message: 'Xác thực thành công và tài khoản đã được khởi tạo!',
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// @desc    Login with email and password
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }
    const user = await db.User.findOne({ 
      where: { [db.Sequelize.Op.or]: [{ email: email }, { phone: email }] } 
    });
    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: !user ? 'Email, Số điện thoại hoặc mật khẩu không đúng' : 'Tài khoản của bạn đã bị khóa.',
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email, Số điện thoại hoặc mật khẩu không đúng' });
    }
    const token = generateToken(user);
    const userData = user.toJSON();
    delete userData.password;
    return res.status(200).json({ success: true, data: { user: userData, token } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// @desc    Get current user profile
const getProfile = async (req, res) => {
  try {
    const includeOptions = [];
    if (req.user.role === 'staff' || req.user.role === 'admin') {
      includeOptions.push({ model: db.Branch, as: 'branch' });
    }
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: includeOptions,
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// @desc    Update user profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (req.file) updateData.avatar = req.file.path;
    await db.User.update(updateData, { where: { id: req.user.id } });
    const updatedUser = await db.User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    return res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// @desc    Change password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await db.User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Old password is incorrect.' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.User.update({ password: hashedPassword }, { where: { id: req.user.id } });
    return res.status(200).json({ success: true, data: { message: 'Password changed successfully.' } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// @desc    Login with Google
const googleLogin = async (req, res) => {
  try {
    const { tokenId, code, redirect_uri } = req.body;
    let email, fullName, avatar, googleId;
    if (code) {
      const { tokens } = await client.getToken({ code, redirect_uri: redirect_uri || process.env.GOOGLE_REDIRECT_URI });
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      googleId = payload.sub; email = payload.email; fullName = payload.name; avatar = payload.picture;
    } else {
      const ticket = await client.verifyIdToken({ idToken: tokenId, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      googleId = payload.sub; email = payload.email; fullName = payload.name; avatar = payload.picture;
    }
    let user = await db.User.findOne({ where: { [db.Sequelize.Op.or]: [{ googleId }, { email }] } });
    if (!user) {
      user = await db.User.create({ fullName, email, googleId, avatar, role: 'customer', password: null, isEmailVerified: true });
    } else {
      if (user.isActive === false) return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa.' });
      if (!user.googleId) await user.update({ googleId, avatar: user.avatar || avatar, isEmailVerified: true });
    }
    const token = generateToken(user);
    const userData = user.toJSON(); delete userData.password;
    return res.status(200).json({ success: true, data: { user: userData, token } });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Xác thực Google thất bại.' });
  }
};

// @desc    Verify OTP for general verification
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await db.OtpCode.findOne({
      where: { email, code: otp, type: 'registration', isUsed: false, expiresAt: { [db.Sequelize.Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']]
    });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Mã xác thực không đúng hoặc đã hết hạn.' });
    await otpRecord.update({ isUsed: true });
    await db.User.update({ isEmailVerified: true }, { where: { id: req.user.id } });
    return res.status(200).json({ success: true, message: 'Xác thực email thành công.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// @desc    Resend OTP
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email.' });
    const lastOtp = await db.OtpCode.findOne({ where: { email, type: 'registration' }, order: [['createdAt', 'DESC']] });
    if (lastOtp && (Date.now() - new Date(lastOtp.createdAt).getTime() < 60000)) {
      return res.status(429).json({ success: false, message: 'Vui lòng đợi 60 giây.' });
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await db.OtpCode.create({ email, code: otpCode, type: 'registration', expiresAt });
    await emailService.sendOtpEmail(email, otpCode);
    return res.status(200).json({ success: true, message: 'Mã xác thực mới đã được gửi.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// @desc    Send verification email
const sendVerifyEmail = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await db.OtpCode.create({ email: user.email, code: otpCode, type: 'registration', expiresAt });
    await emailService.sendOtpEmail(user.email, otpCode);
    return res.status(200).json({ success: true, message: 'Mã xác thực đã được gửi.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// @desc    Request OTP for forgotten password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email.' });
    }

    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống.' });
    }

    // Check if there is already an unexpired OTP to prevent spam
    const lastOtp = await db.OtpCode.findOne({ 
      where: { email, type: 'reset_password' }, 
      order: [['createdAt', 'DESC']] 
    });
    if (lastOtp && (Date.now() - new Date(lastOtp.createdAt).getTime() < 60000)) {
      return res.status(429).json({ success: false, message: 'Vui lòng đợi 60 giây trước khi yêu cầu mã mới.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    await db.OtpCode.create({
      email,
      code: otpCode,
      type: 'reset_password',
      expiresAt
    });

    try {
      await emailService.sendOtpEmail(email, otpCode);
    } catch (emailError) {
      console.error('Lỗi gửi email OTP reset password:', emailError.message);
      console.log('==================================================');
      console.log(`[DEV MODE] MÃ OTP RESET PASSWORD CỦA ${email} LÀ: ${otpCode}`);
      console.log('==================================================');
    }

    return res.status(200).json({ success: true, message: 'Mã xác thực đã được gửi đến email của bạn.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin.' });
    }

    // Find valid OTP
    const otpRecord = await db.OtpCode.findOne({
      where: {
        email,
        code: otp,
        type: 'reset_password',
        isUsed: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Mã xác thực không đúng hoặc đã hết hạn.' });
    }

    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await user.update({ password: hashedPassword });
    
    // Mark OTP as used
    await otpRecord.update({ isUsed: true });

    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
  verifyOtp,
  resendOtp,
  sendVerifyEmail,
  verifyRegistrationOtp,
  forgotPassword,
  resetPassword,
};
