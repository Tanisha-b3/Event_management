const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Try local JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      req.user = { id: user._id, email: user.email, role: user.role || 'booker', name: user.name };
      return next();
    } catch (jwtErr) {
      // Fallback: verify Google ID token if configured
      if (!googleClient) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
      }

      try {
        const ticket = await googleClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload) {
          return res.status(401).json({ success: false, error: 'Invalid Google token' });
        }

        // If the Google user exists in DB, use their role; otherwise default to booker
        const existing = await User.findOne({ email: payload.email }).select('-password');
        const role = existing?.role || 'booker';

        req.user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          authProvider: 'google',
          role
        };
        return next();
      } catch (gErr) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden: insufficient role' });
  }
  return next();
};

module.exports = { auth, authorizeRoles };
