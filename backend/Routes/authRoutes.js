const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Request OTP
router.post(
  '/request-otp',
  [
    body('mobileNumber')
      .notEmpty()
      .withMessage('Mobile number is required')
      .matches(/^[0-9]{10}$/)
      .withMessage('Please enter a valid 10-digit mobile number')
  ],
  authController.requestOTP
);

// Verify OTP and login
router.post(
  '/verify-otp',
  [
    body('mobileNumber')
      .notEmpty()
      .withMessage('Mobile number is required')
      .matches(/^[0-9]{10}$/)
      .withMessage('Please enter a valid 10-digit mobile number'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  authController.verifyOTP
);

// Get profile
router.get('/profile', protect, authController.getProfile);

// Update profile
router.put('/profile', protect, authController.updateProfile);

module.exports = router;