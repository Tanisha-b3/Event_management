// const express = require('express');
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import Notification from '../models/Notification.js';

import { emitToUser, emitToAll } from '../socketHandler.js';
import { sendEmail } from '../controllers/email.js';
import { sendVerificationSMS, sendLoginOTP } from '../utils/smsSender.js';
import { OAuth2Client } from 'google-auth-library';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

const OTP_EXPIRE_MINUTES = 5;
const router = express.Router();
// Middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Helper function to emit auth events safely
const emitAuthEvent = async (user, action) => {
  if (!user || !user._id) return;

  try {
    const eventName = action === 'register' ? 'auth:register' : 'auth:login';
    const notificationType = action === 'register' ? 'auth_register' : 'auth_login';
    const title = action === 'register' ? 'Welcome to EventPro 🎉' : 'Signed in';
    const message = action === 'register'
      ? 'Your account was created successfully.'
      : 'You signed in successfully.';

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    emitToUser(user._id, eventName, payload);

    const notification = new Notification({
      userId: user._id,
      type: notificationType,
      title,
      message,
      data: { link: '/profile' }
    });

    await notification.save();
    emitToUser(user._id, 'notification:new', notification);
  } catch (error) {
    console.error('Auth socket emit error:', error.message);
  }
};

// Google OAuth login/exchange
router.post('/google', async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ success: false, error: 'Google login not configured' });
    }

    const { credential, isSignUp } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({ 
      idToken: credential, 
      audience: GOOGLE_CLIENT_ID 
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ success: false, error: 'Invalid Google token' });
    }

    let user = await User.findOne({ email: payload.email, isDeleted: false });

    if (isSignUp) {
      // Google Sign Up flow
      if (user) {
        return res.status(400).json({ 
          success: false, 
          error: 'An account with this email already exists. Please sign in instead.' 
        });
      }
      
      // Generate a random secure password for Google users
      const tempPassword = Math.random().toString(36) + Date.now() + Math.random().toString(36);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        password: hashedPassword,
        role: 'booker',
        authProvider: 'google',
        avatar: payload.picture || '',
        status: 'active',
        isDeleted: false
      });
    } else {
      // Google Sign In flow
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'No account found with this email. Please sign up first.' 
        });
      }
      
      if (user.authProvider !== 'google') {
        return res.status(401).json({ 
          success: false, 
          error: 'This account was not created with Google. Please sign in with your email and password.' 
        });
      }
      
      if (user.status === 'banned') {
        return res.status(403).json({ 
          success: false, 
          error: 'Your account has been banned. Please contact support.' 
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    await emitAuthEvent(user, isSignUp ? 'register' : 'login');

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: payload?.picture || user.avatar,
        authProvider: user.authProvider,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ success: false, error: 'Failed to process Google login' });
  }
});

// Register route - Step 1: Check if email available, create pending user, send OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists (including pending)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }

    const allowedRoles = ['admin', 'booker', 'organiser'];
    const userRole = allowedRoles.includes(role) ? role : 'booker';

    // Create pending user (will be activated after OTP verify)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: phone || '',
      role: userRole,
      authProvider: 'local',
      status: 'pending', // Not active yet
      isDeleted: false
    });

    // Generate temp token for OTP verification
    const tempToken = jwt.sign(
      { id: user._id, type: 'temp-register' },
      JWT_SECRET,
      { expiresIn: `${OTP_EXPIRE_MINUTES}m` }
    );
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    // Store OTP
    await User.updateOne(
      { _id: user._id },
      {
        'otp.code': otp,
        'otp.expiresAt': expiresAt,
        'otp.method': 'email',
        'otp.isVerified': false,
        'tempLoginToken.token': tempToken,
        'tempLoginToken.expiresAt': new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000)
      }
    );

    // Send OTP email
    await sendEmail({
      body: {
        to: normalizedEmail,
        subject: 'Your EventPro OTP Code',
        template: 'otp',
        templateData: {
          otp,
          minutes: OTP_EXPIRE_MINUTES
        }
      }
    }, { json: () => {} });

    res.status(201).json({
      success: true,
      tempToken,
      message: 'OTP sent to your email'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error during registration'
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Normalize email
    email = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user || user.isDeleted) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check banned
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been banned. Please contact support.'
      });
    }

    // Check pending (not verified)
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        error: 'Please verify your account first. Check your email for OTP.'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    await emitAuthEvent(user, 'login');

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        status: user.status,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        privacy: user.privacy,
        notifications: user.notifications
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Verify token route
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, isDeleted: false }).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Account banned' });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        status: user.status,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, isDeleted: false });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Generate OTP
function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

// Verify password and get temp token
router.post('/verify-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Your account has been banned' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate temp token for 2FA
    const tempToken = jwt.sign(
      { id: user._id, type: 'temp-login' },
      JWT_SECRET,
      { expiresIn: `${OTP_EXPIRE_MINUTES}m` }
    );

    await User.updateOne(
      { _id: user._id },
      {
        'tempLoginToken.token': tempToken,
        'tempLoginToken.expiresAt': new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000)
      }
    );

    res.json({
      success: true,
      tempToken,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Verify password error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Send 2FA OTP - for login flow
router.post('/send-2fa-otp', async (req, res) => {
  try {
    const { tempToken, email, phone, method } = req.body;

    // Support both tempToken in body or via email lookup
    let user;
    if (tempToken) {
      let decoded;
      try {
        decoded = jwt.verify(tempToken, JWT_SECRET);
      } catch (e) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
      }

      if (decoded.type !== 'temp-login') {
        return res.status(401).json({ success: false, error: 'Invalid token type' });
      }

      user = await User.findOne({ _id: decoded.id });
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      return res.status(400).json({ success: false, error: 'Email or temp token is required' });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const otpMethod = method === 'phone' && phone ? 'phone' : 'email';
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        'otp.code': otp,
        'otp.expiresAt': expiresAt,
        'otp.method': otpMethod,
        'otp.isVerified': false
      }
    );

    // Send OTP via email or SMS based on method
    if (otpMethod === 'phone' && phone) {
      await sendLoginOTP(phone, otp);
    } else {
      console.log(`OTP for ${user.email}: ${otp}`);
    }

    res.json({
      success: true,
      message: `OTP sent to your ${otpMethod}`
    });
  } catch (err) {
    console.error('Send 2FA OTP error:', err);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// Resend 2FA OTP
router.post('/resend-2fa-otp', async (req, res) => {
  try {
    const { tempToken, method } = req.body;

    if (!tempToken) {
      return res.status(400).json({ success: false, error: 'Temp token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    if (decoded.type !== 'temp-login') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    const otpMethod = method || 'email';

    await User.updateOne(
      { _id: user._id },
      {
        'otp.code': otp,
        'otp.expiresAt': expiresAt,
        'otp.method': otpMethod,
        'otp.isVerified': false
      }
    );

    // Send OTP via email or SMS based on method
    if (otpMethod === 'phone' && user.phone) {
      await sendLoginOTP(user.phone, otp);
    } else {
      console.log(`OTP for ${user.email}: ${otp}`);
    }

    res.json({
      success: true,
      message: `OTP resent to your ${otpMethod}`
    });
  } catch (err) {
    console.error('Resend 2FA OTP error:', err);
    res.status(500).json({ success: false, error: 'Failed to resend OTP' });
  }
});

// Verify 2FA OTP
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ success: false, error: 'Temp token and OTP are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    if (decoded.type !== 'temp-login') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check OTP
    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (!user.otp.expiresAt || new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    // Clear temp token and OTP
    await User.updateOne(
      { _id: user._id },
      {
        'otp.code': '',
        'otp.expiresAt': null,
        'otp.isVerified': true,
        'tempLoginToken.token': '',
        'tempLoginToken.expiresAt': null
      }
    );

    // Generate final token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    await emitAuthEvent(user, 'login');

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        status: user.status,
        avatar: user.avatar,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Verify 2FA error:', err);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ success: false, error: 'Google users cannot change password' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// Send verification OTP for registration
router.post('/send-verification-otp', async (req, res) => {
  try {
    const { email, phone, method, tempToken } = req.body;

    let user;
    if (tempToken) {
      let decoded;
      try {
        decoded = jwt.verify(tempToken, JWT_SECRET);
      } catch (e) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
      }

      if (decoded.type !== 'temp-register') {
        return res.status(401).json({ success: false, error: 'Invalid token type' });
      }

      user = await User.findOne({ _id: decoded.id });
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      return res.status(400).json({ success: false, error: 'Email or temp token is required' });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const otpMethod = method === 'phone' && phone ? 'phone' : 'email';
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        'otp.code': otp,
        'otp.expiresAt': expiresAt,
        'otp.method': otpMethod,
        'otp.isVerified': false
      }
    );

    // Send OTP via email or SMS based on method
    if (otpMethod === 'phone' && phone) {
      await sendVerificationSMS(phone, otp);
    } else {
      console.log(`Verification OTP for ${user.email}: ${otp}`);
    }

    res.json({
      success: true,
      message: `Verification OTP sent to your ${otpMethod}`
    });
  } catch (err) {
    console.error('Send verification OTP error:', err);
    res.status(500).json({ success: false, error: 'Failed to send verification OTP' });
  }
});

// Resend verification OTP
router.post('/resend-verification-otp', async (req, res) => {
  try {
    const { tempToken, method } = req.body;

    if (!tempToken) {
      return res.status(400).json({ success: false, error: 'Temp token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    if (decoded.type !== 'temp-register') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    const otpMethod = method || 'email';

    await User.updateOne(
      { _id: user._id },
      {
        'otp.code': otp,
        'otp.expiresAt': expiresAt,
        'otp.method': otpMethod,
        'otp.isVerified': false
      }
    );

    console.log(`Verification OTP for ${user.email}: ${otp}`);

    res.json({
      success: true,
      message: `Verification OTP resent to your ${otpMethod}`
    });
  } catch (err) {
    console.error('Resend verification OTP error:', err);
    res.status(500).json({ success: false, error: 'Failed to resend OTP' });
  }
});

// Verify registration OTP - activates pending user
router.post('/verify-registration-otp', async (req, res) => {
  try {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ success: false, error: 'Temp token and OTP are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    if (decoded.type !== 'temp-register') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if already verified
    if (user.status === 'active') {
      return res.status(400).json({ success: false, error: 'Account already verified' });
    }

    // Check OTP
    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (!user.otp.expiresAt || new Date() > user.otp.expiresAt) {
      // OTP expired - delete the pending user
      await User.deleteOne({ _id: user._id });
      return res.status(400).json({ success: false, error: 'OTP has expired. Please register again.' });
    }

    // Activate user and clear OTP
    await User.updateOne(
      { _id: user._id },
      {
        status: 'active',
        'otp.code': '',
        'otp.expiresAt': null,
        'otp.isVerified': true,
        'tempLoginToken.token': '',
        'tempLoginToken.expiresAt': null
      }
    );

    // Generate final token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    await emitAuthEvent(user, 'register');

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        status: 'active',
        avatar: user.avatar,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Verify registration OTP error:', err);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

export default router;