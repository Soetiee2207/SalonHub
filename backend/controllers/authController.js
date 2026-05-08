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
    await emailService.sendOtpEmail(email, otpCode);

    return res.status(200).json({
      success: true,
      message: 'Mã xác thực đã được gửi đến email của bạn.',
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
};
