const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorizeRoles, protect } = require('../middleware/Auth');
const upload = require('../middleware/upload');

// Search users (for admin booking)
router.get('/search', auth, authorizeRoles('admin', 'organiser'), async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }
    
    const users = await User.find({
      isDeleted: false,
      status: 'active',
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email role avatar phone')
    .limit(10);
    
    res.json({ success: true, users });
  } catch (err) {
    console.error('Search users error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
});

// Public user search - for messaging (only returns basic info)
router.get('/search-public', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json([]);
    }
    
    const userRole = req.user.role;
    let query = {
      isDeleted: false,
      status: 'active',
      _id: { $ne: req.user.id }
    };

    // If booker, only show admins and organisers
    if (userRole === 'booker') {
      query.role = { $in: ['admin', 'organiser'] };
    }
    
    query.$or = [
      { email: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } }
    ];
    
    const users = await User.find(query)
    .select('name email avatar role')
    .limit(10);
    
    res.json(users);
  } catch (err) {
    console.error('Search users error:', err.message);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get single user by ID
router.get('/:id', auth, authorizeRoles('admin', 'organiser'), async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    }).select('name email role avatar phone bio');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get current user's profile
router.get('/profile/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.user.id, 
      isDeleted: false 
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// Update current user's profile (with avatar upload)
// Multer error handler wrapper
function multerErrorHandler(err, req, res, next) {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ success: false, error: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
}

router.put('/profile/me', protect, (req, res, next) => {
  upload.single('avatar')(req, res, function(err) {
    if (err) return multerErrorHandler(err, req, res, next);
    (async () => {
      try {
        const { name, email, phone, bio, location } = req.body;
        let avatar = req.body.avatar;
        if (req.file) {
          avatar = `/uploads/avatars/${req.file.filename}`;
        }
        const user = await User.findById(req.user.id);
        if (!user) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }
        if (email && email !== user.email) {
          const emailTaken = await User.findOne({ email, isDeleted: false, _id: { $ne: req.user.id } });
          if (emailTaken) {
            return res.status(400).json({ success: false, error: 'Email already in use' });
          }
          user.email = email;
        }
        if (name && name.trim()) user.name = name.trim();
        if (phone !== undefined) user.phone = phone;
        if (bio !== undefined) user.bio = bio;
        if (location !== undefined) user.location = location;
        if (avatar && avatar !== user.avatar) user.avatar = avatar;
        await user.save();
        const userResponse = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          bio: user.bio,
          location: user.location,
          avatar: user.avatar,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
        res.json({ success: true, user: userResponse });
      } catch (err) {
        console.error('Update profile error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
      }
    })();
  });
});

// Update password
router.put('/profile/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please provide current and new password' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// Update privacy settings
router.put('/profile/privacy', protect, async (req, res) => {
  try {
    const { showEmail, showProfile, showLocation } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (showEmail !== undefined) user.privacy.showEmail = showEmail;
    if (showProfile !== undefined) user.privacy.showProfile = showProfile;
    if (showLocation !== undefined) user.privacy.showLocation = showLocation;
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Privacy settings updated',
      privacy: user.privacy 
    });
  } catch (err) {
    console.error('Update privacy error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update privacy settings' });
  }
});

// Update notification settings
router.put('/profile/notifications', protect, async (req, res) => {
  try {
    const { email, push, ticketBooked, eventReminders, promotions, orderUpdates } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (email !== undefined) user.notifications.email = email;
    if (push !== undefined) user.notifications.push = push;
    if (ticketBooked !== undefined) user.notifications.ticketBooked = ticketBooked;
    if (eventReminders !== undefined) user.notifications.eventReminders = eventReminders;
    if (promotions !== undefined) user.notifications.promotions = promotions;
    if (orderUpdates !== undefined) user.notifications.orderUpdates = orderUpdates;
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Notification settings updated',
      notifications: user.notifications 
    });
  } catch (err) {
    console.error('Update notifications error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update notification settings' });
  }
});

// Get all users (admin only)
router.get('/admin/all', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const role = req.query.role;
    const status = req.query.status;
    
    let query = { isDeleted: false };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Get all users error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.put('/:id/role', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['admin', 'booker', 'organiser'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Prevent changing own role if you're the only admin
    if (user._id.toString() === req.user.id && user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isDeleted: false });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot change role of the only admin' });
      }
    }
    
    user.role = role;
    await user.save();
    
    res.json({ 
      success: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    console.error('Update user role error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

// Toggle user status (admin only)
router.put('/:id/status', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Prevent disabling own account
    if (user._id.toString() === req.user.id && status !== 'active') {
      return res.status(400).json({ success: false, error: 'You cannot disable your own account' });
    }
    
    user.status = status;
    await user.save();
    
    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (err) {
    console.error('Update user status error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
});

// Soft delete user (admin only)
router.delete('/:id', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Prevent deleting own account
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }
    
    // Prevent deleting last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isDeleted: false, _id: { $ne: req.user.id } });
      if (adminCount === 0) {
        return res.status(400).json({ success: false, error: 'Cannot delete the last admin' });
      }
    }
    
    await user.softDelete();
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Get user statistics (admin only)
router.get('/admin/stats', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const [totalUsers, activeUsers, adminCount, organiserCount, bookerCount] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, status: 'active' }),
      User.countDocuments({ isDeleted: false, role: 'admin' }),
      User.countDocuments({ isDeleted: false, role: 'organiser' }),
      User.countDocuments({ isDeleted: false, role: 'booker' })
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        admins: adminCount,
        organisers: organiserCount,
        bookers: bookerCount
      }
    });
  } catch (err) {
    console.error('Get user stats error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch user statistics' });
  }
});

// Bulk update user status (admin only)
router.put('/admin/bulk-status', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userIds, status } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide user IDs' });
    }
    
    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    // Prevent bulk updating own account
    const filteredIds = userIds.filter(id => id.toString() !== req.user.id);
    
    const result = await User.updateMany(
      { _id: { $in: filteredIds }, isDeleted: false },
      { status }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} users updated to ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Bulk update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update users' });
  }
});

// Legacy route aliases (for backward compatibility)
router.get('/profile', auth, async (req, res) => {
  req.url = '/profile/me';
  return router.handle(req, res);
});

router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
  req.url = '/profile/me';
  return router.handle(req, res);
});

module.exports = router;