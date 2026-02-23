const User = require('../models/User');
const Cart = require('../models/Cart');
const { validationResult } = require('express-validator');

// @desc    Request OTP for login/register
// @route   POST /api/auth/request-otp
// @access  Public
exports.requestOTP = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    // Validate mobile number
    if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    // Check if user exists
    let user = await User.findOne({ mobileNumber });

    if (!user) {
      // Create new user
      user = new User({ mobileNumber });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // In production, send OTP via SMS (Twilio) or Email
    console.log(`OTP for ${mobileNumber}: ${otp}`);

    // For demo, return OTP in response (remove in production)
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        mobileNumber,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        expiresIn: process.env.OTP_EXPIRE_MINUTES || 10
      }
    });

  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify OTP and login/register
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    // Find user
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please request OTP first.'
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    // Create cart for user if doesn't exist
    let cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      cart = new Cart({ user: user._id });
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          mobileNumber: user.mobileNumber,
          name: user.name,
          email: user.email,
          address: user.address,
          role: user.role
        },
        cart: {
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          grandTotal: cart.grandTotal
        }
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, address } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.address = address;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};