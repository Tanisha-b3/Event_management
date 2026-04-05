const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

router.use(express.json()); // for parsing application/json
router.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Google OAuth login/exchange
router.post('/google', async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ success: false, error: 'Google login not configured' });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ success: false, error: 'Invalid Google token' });
    }

    // Find or create user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      const tempPassword = bcrypt.genSaltSync(10); // random placeholder
      user = await User.create({
        name: payload.name || payload.email,
        email: payload.email,
        password: tempPassword,
        role: 'booker'
      });
    }

    const token = user.getJWTToken();
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: payload.picture,
        authProvider: 'google',
        role: user.role
      }
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ success: false, error: 'Failed to process Google login' });
  }
});

// Updated register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide name, email and password' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already in use' 
      });
    }

    const allowedRoles = ['admin', 'booker', 'organiser'];
    const userRole = allowedRoles.includes(role) ? role : 'booker';

    const user = await User.create({ name, email, password, role: userRole });
    
    const token = user.getJWTToken();
    res.status(201).set('Content-Type', 'application/json').json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during registration' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate token
    const token = user.getJWTToken();
    
    res.status(200).json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
)


module.exports = router;
