const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
  verifyOtp,
  resendOtp,
  sendVerifyEmail,
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
// Protected routes (require authentication)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, uploadSingle, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/send-verify-email', authenticate, sendVerifyEmail);
router.post('/verify-otp', authenticate, verifyOtp);
router.post('/resend-otp', authenticate, resendOtp);

module.exports = router;
