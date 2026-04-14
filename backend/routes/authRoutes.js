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
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Protected routes (require authentication)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, uploadSingle, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
