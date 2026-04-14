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

// @desc    Register new customer account (Phase 1: Send OTP)
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

    // Check if user already exists by email or phone
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

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await db.OtpCode.create({
      email,
      code: otpCode,
      type: 'registration',
      expiresAt,
    });

    // Send email via OAuth2
    await emailService.sendOtpEmail(email, otpCode);

    return res.status(200).json({
      success: true,
      message: 'Mã xác thực đã được gửi về email của bạn. Vui lòng kiểm tra.',
      data: { email }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error.',
    });
  }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp, registrationData } = req.body;

    if (!email || !otp || !registrationData) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin xác thực.',
      });
    }

    // Find the OTP
    const otpRecord = await db.OtpCode.findOne({
      where: {
        email,
        code: otp,
        type: 'registration',
        isUsed: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực không đúng hoặc đã hết hạn.',
      });
    }

    // Mark OTP as used
    await otpRecord.update({ isUsed: true });

    // Create User
    const { fullName, password, phone } = registrationData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await db.User.create({
      fullName,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: 'customer',
    });

    // Generate token
    const token = generateToken(user);

    const userData = user.toJSON();
    delete userData.password;

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công.',
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email.',
      });
    }

    // Cooldown check (60 seconds)
    const lastOtp = await db.OtpCode.findOne({
      where: { email, type: 'registration' },
      order: [['createdAt', 'DESC']]
    });

    if (lastOtp && (Date.now() - new Date(lastOtp.createdAt).getTime() < 60000)) {
      return res.status(429).json({
        success: false,
        message: 'Vui lòng đợi 60 giây trước khi yêu cầu mã mới.',
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.OtpCode.create({
      email,
      code: otpCode,
      type: 'registration',
      expiresAt,
    });

    await emailService.sendOtpEmail(email, otpCode);

    return res.status(200).json({
      success: true,
      message: 'Mã xác thực mới đã được gửi.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
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

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user by email or phone
    const user = await db.User.findOne({ 
      where: { 
        [db.Sequelize.Op.or]: [{ email: email }, { phone: email }] 
      } 
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email, Số điện thoại hoặc mật khẩu không đúng',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email, Số điện thoại hoặc mật khẩu không đúng',
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return user info without password
    const userData = user.toJSON();
    delete userData.password;

    return res.status(200).json({
      success: true,
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const includeOptions = [];

    // Include branch info if staff or admin
    if (req.user.role === 'staff' || req.user.role === 'admin') {
      includeOptions.push({
        model: db.Branch,
        as: 'branch',
      });
    }

    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: includeOptions,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// @desc    Update user profile (fullName, phone, avatar)
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const updateData = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;

    // Handle avatar upload via Cloudinary
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    await db.User.update(updateData, {
      where: { id: req.user.id },
    });

    // Fetch updated user
    const updatedUser = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide old password and new password.',
      });
    }

    // Get user with password
    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect.',
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.User.update(
      { password: hashedPassword },
      { where: { id: req.user.id } }
    );

    return res.status(200).json({
      success: true,
      data: { message: 'Password changed successfully.' },
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

// @desc    Login with Google
// @route   POST /api/auth/google-login
const googleLogin = async (req, res) => {
  try {
    const { tokenId, code, redirect_uri } = req.body;

    if (!tokenId && !code) {
      return res.status(400).json({
        success: false,
        message: 'Google Token or Code is required.',
      });
    }

    let email, fullName, avatar, googleId;

    if (code) {
      // Redirect flow: Exchange code for tokens
      const clientRedirectUri = redirect_uri || process.env.GOOGLE_REDIRECT_URI || 'https://salonhub-soe.vercel.app/login';
      
      const { tokens } = await client.getToken({
        code,
        redirect_uri: clientRedirectUri,
      });
      
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      fullName = payload.name;
      avatar = payload.picture;
    } else {
      // Legacy popup flow
      const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      fullName = payload.name;
      avatar = payload.picture;
    }

    // Find or create user
    let user = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ googleId }, { email }],
      },
    });

    if (!user) {
      // Create new customer account if not exists
      user = await db.User.create({
        fullName,
        email,
        googleId,
        avatar,
        role: 'customer',
        password: null, // No password for Google users
      });
    } else {
      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
        });
      }
      if (!user.googleId) {
        // Link Google account to existing email account
        await user.update({ googleId, avatar: user.avatar || avatar });
      }
    }

    // Generate SalonHub token
    const token = generateToken(user);

    const userData = user.toJSON();
    delete userData.password;

    return res.status(200).json({
      success: true,
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error('Google Login error:', error);
    return res.status(401).json({
      success: false,
      message: 'Xác thực Google thất bại.',
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
};
