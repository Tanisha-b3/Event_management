import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, setPrimaryColor, setFontSize, setColorScheme, setHighContrast } from '../store/slices/themeSlice';
import { updateProfile, updatePrivacySettings, updateNotificationSettings } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaUser, 
  FaBell, 
  FaLock, 
  FaPalette, 
  FaMoon, 
  FaSun, 
  FaEnvelope, 
  FaMobile, 
  FaSave, 
  FaTrash, 
  FaEdit, 
  FaGlobe, 
  FaMapMarkerAlt, 
  FaUserCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaInfoCircle
} from 'react-icons/fa';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const themeState = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    avatar: '',
    notifications: {
      email: true,
      push: true,
      ticketBooked: true,
      eventReminders: true,
      promotions: false,
      orderUpdates: true,
    },
    privacy: {
      showEmail: false,
      showProfile: true,
      showLocation: false,
    },
    darkMode: false,
    fontSize: 'medium',
    colorScheme: 'default',
    highContrast: false,
  });

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || '',
        notifications: user.notifications || prev.notifications,
        privacy: user.privacy || prev.privacy,
        darkMode: themeState.mode === 'dark',
        fontSize: themeState.fontSize,
        colorScheme: themeState.colorScheme,
        highContrast: themeState.highContrast,
      }));
    }
  }, [user, themeState.mode]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    if (settings.highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
  }, [settings.darkMode, settings.highContrast]);

  const handleChange = (section, field, value) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [field]: value }));
      if (field === 'darkMode') {
        dispatch(setTheme(value ? 'dark' : 'light'));
      }
      if (field === 'fontSize') {
        dispatch(setFontSize(value));
      }
      if (field === 'colorScheme') {
        dispatch(setColorScheme(value));
      }
      if (field === 'highContrast') {
        dispatch(setHighContrast(value));
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      dispatch(setTheme(settings.darkMode ? 'dark' : 'light'));
      dispatch(setFontSize(settings.fontSize));
      dispatch(setColorScheme(settings.colorScheme));
      dispatch(setHighContrast(settings.highContrast));
      
      await dispatch(updateProfile({
        name: settings.name,
        phone: settings.phone,
        bio: settings.bio,
        location: settings.location
      })).unwrap();
      
      await dispatch(updatePrivacySettings(settings.privacy)).unwrap();
      await dispatch(updateNotificationSettings(settings.notifications)).unwrap();
      
      toast.success('Settings saved successfully!');
      setEditingField(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    toast.success('Password changed successfully!');
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.info('Account deletion feature coming soon');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser, description: 'Manage your personal information' },
    { id: 'notifications', label: 'Notifications', icon: FaBell, description: 'Configure alert preferences' },
    { id: 'privacy', label: 'Privacy', icon: FaLock, description: 'Control your data visibility' },
    { id: 'appearance', label: 'Appearance', icon: FaPalette, description: 'Customize your experience' },
  ];

  return (
    <div className="settings-container">
      <div className="settings-wrapper">
        {/* Header */}
        <div className="settings-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <FaArrowLeft />
            <span>Back</span>
          </button>
          <div className="header-content">
            <h1 className="settings-title">
              <span className="gradient-text">Settings</span>
            </h1>
            <p className="settings-subtitle">Customize your account preferences and experience</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="settings-card">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <div className="user-summary">
              <div className="user-avatar">
                {settings.avatar ? (
                  <img src={settings.avatar} alt={settings.name} />
                ) : (
                  <FaUserCircle />
                )}
              </div>
              <div className="user-info">
                <h3>{settings.name || 'Guest User'}</h3>
                <p>{settings.email}</p>
              </div>
            </div>
            <div className="tabs-list">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <div className="tab-icon-wrapper">
                    <tab.icon className="tab-icon" />
                  </div>
                  <div className="tab-content">
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-description">{tab.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="settings-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>Profile Settings</h2>
                  <p>Update your personal information and public profile</p>
                </div>
                <div className="profile-form">
                  {/* Name Field */}
                  <div className="form-field">
                    <div className="field-header">
                      <div className="field-label-wrapper">
                        <FaUser className="field-icon" />
                        <label>Full Name</label>
                      </div>
                      <button 
                        onClick={() => setEditingField(editingField === 'name' ? null : 'name')}
                        className="edit-button"
                      >
                        <FaEdit />
                        <span>{editingField === 'name' ? 'Cancel' : 'Edit'}</span>
                      </button>
                    </div>
                    {editingField === 'name' ? (
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => handleChange(null, 'name', e.target.value)}
                        className="form-input"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="field-value">
                        <p>{settings.name || <span className="placeholder">Not set</span>}</p>
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="form-field">
                    <div className="field-header">
                      <div className="field-label-wrapper">
                        <FaEnvelope className="field-icon" />
                        <label>Email Address</label>
                      </div>
                      <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="edit-button"
                      >
                        <FaShieldAlt />
                        <span>Change Password</span>
                      </button>
                    </div>
                    <div className="field-value readonly">
                      <p>{settings.email}</p>
                      <span className="readonly-badge">Read only</span>
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="form-field">
                    <div className="field-header">
                      <div className="field-label-wrapper">
                        <FaMobile className="field-icon" />
                        <label>Phone Number</label>
                      </div>
                      <button 
                        onClick={() => setEditingField(editingField === 'phone' ? null : 'phone')}
                        className="edit-button"
                      >
                        <FaEdit />
                        <span>{editingField === 'phone' ? 'Cancel' : 'Edit'}</span>
                      </button>
                    </div>
                    {editingField === 'phone' ? (
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => handleChange(null, 'phone', e.target.value)}
                        className="form-input"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className="field-value">
                        <p>{settings.phone || <span className="placeholder">Not set</span>}</p>
                      </div>
                    )}
                  </div>

                  {/* Bio Field */}
                  <div className="form-field">
                    <div className="field-header">
                      <div className="field-label-wrapper">
                        <FaInfoCircle className="field-icon" />
                        <label>Bio</label>
                      </div>
                      <button 
                        onClick={() => setEditingField(editingField === 'bio' ? null : 'bio')}
                        className="edit-button"
                      >
                        <FaEdit />
                        <span>{editingField === 'bio' ? 'Cancel' : 'Edit'}</span>
                      </button>
                    </div>
                    {editingField === 'bio' ? (
                      <textarea
                        value={settings.bio}
                        onChange={(e) => handleChange(null, 'bio', e.target.value)}
                        className="form-textarea"
                        rows={4}
                        placeholder="Tell us about yourself"
                      />
                    ) : (
                      <div className="field-value">
                        <p>{settings.bio || <span className="placeholder">No bio added yet</span>}</p>
                      </div>
                    )}
                  </div>

                  {/* Location Field */}
                  <div className="form-field">
                    <div className="field-header">
                      <div className="field-label-wrapper">
                        <FaMapMarkerAlt className="field-icon" />
                        <label>Location</label>
                      </div>
                      <button 
                        onClick={() => setEditingField(editingField === 'location' ? null : 'location')}
                        className="edit-button"
                      >
                        <FaEdit />
                        <span>{editingField === 'location' ? 'Cancel' : 'Edit'}</span>
                      </button>
                    </div>
                    {editingField === 'location' ? (
                      <input
                        type="text"
                        value={settings.location}
                        onChange={(e) => handleChange(null, 'location', e.target.value)}
                        className="form-input"
                        placeholder="Enter your location"
                      />
                    ) : (
                      <div className="field-value">
                        <p>{settings.location || <span className="placeholder">Not set</span>}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>Notification Preferences</h2>
                  <p>Choose how you want to receive updates</p>
                </div>
                <div className="notifications-list">
                  <div className="notification-group">
                    <h3>Communication Channels</h3>
                    <div className="notification-item">
                      <div className="notification-info">
                        <FaEnvelope className="notification-icon" />
                        <div>
                          <p className="notification-title">Email Notifications</p>
                          <p className="notification-desc">Receive notifications via email</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email}
                          onChange={(e) => handleChange('notifications', 'email', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="notification-item">
                      <div className="notification-info">
                        <FaMobile className="notification-icon" />
                        <div>
                          <p className="notification-title">Push Notifications</p>
                          <p className="notification-desc">Receive push notifications on your device</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push}
                          onChange={(e) => handleChange('notifications', 'push', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3>Event Updates</h3>
                    <div className="notification-item">
                      <div className="notification-info">
                        <div>
                          <p className="notification-title">Ticket Booked</p>
                          <p className="notification-desc">Get notified when tickets are booked</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.notifications.ticketBooked}
                          onChange={(e) => handleChange('notifications', 'ticketBooked', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="notification-item">
                      <div className="notification-info">
                        <div>
                          <p className="notification-title">Event Reminders</p>
                          <p className="notification-desc">Get reminders before events start</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.notifications.eventReminders}
                          onChange={(e) => handleChange('notifications', 'eventReminders', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="notification-item">
                      <div className="notification-info">
                        <div>
                          <p className="notification-title">Order Updates</p>
                          <p className="notification-desc">Get updates about your orders</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.notifications.orderUpdates}
                          onChange={(e) => handleChange('notifications', 'orderUpdates', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="notification-group">
                    <h3>Marketing</h3>
                    <div className="notification-item">
                      <div className="notification-info">
                        <div>
                          <p className="notification-title">Promotions</p>
                          <p className="notification-desc">Receive promotional offers and discounts</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.notifications.promotions}
                          onChange={(e) => handleChange('notifications', 'promotions', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>Privacy & Security</h2>
                  <p>Control your data and privacy settings</p>
                </div>
                <div className="privacy-settings">
                  <div className="privacy-group">
                    <h3>Profile Visibility</h3>
                    <div className="privacy-item">
                      <div>
                        <p className="privacy-label">Show Email Address</p>
                        <p className="privacy-desc">Allow others to see your email address</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showEmail}
                          onChange={(e) => handleChange('privacy', 'showEmail', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="privacy-item">
                      <div>
                        <p className="privacy-label">Show Location</p>
                        <p className="privacy-desc">Display your location on your profile</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showLocation}
                          onChange={(e) => handleChange('privacy', 'showLocation', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="privacy-item">
                      <div>
                        <p className="privacy-label">Public Profile</p>
                        <p className="privacy-desc">Allow your profile to be visible to others</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showProfile}
                          onChange={(e) => handleChange('privacy', 'showProfile', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="danger-zone">
                    <div className="danger-header">
                      <FaExclamationTriangle className="danger-icon" />
                      <h3>Danger Zone</h3>
                    </div>
                    <p className="danger-description">
                      Once you delete your account, there is no going back. All your data will be permanently removed.
                    </p>
                    <button onClick={handleDeleteAccount} className="delete-button">
                      <FaTrash />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>Appearance</h2>
                  <p>Customize how the app looks and feels</p>
                </div>
                <div className="appearance-settings">
                  <div className="theme-selector">
                    <h3>Theme Preference</h3>
                    <div className="theme-options">
                      <button
                        onClick={() => handleChange(null, 'darkMode', false)}
                        className={`theme-option ${!settings.darkMode ? 'active' : ''}`}
                      >
                        <FaSun />
                        <div>
                          <span>Light Mode</span>
                          <small>Bright and clean interface</small>
                        </div>
                      </button>
                      <button
                        onClick={() => handleChange(null, 'darkMode', true)}
                        className={`theme-option ${settings.darkMode ? 'active' : ''}`}
                      >
                        <FaMoon />
                        <div>
                          <span>Dark Mode</span>
                          <small>Easy on the eyes in low light</small>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="font-size-selector">
                    <h3>Font Size</h3>
                    <div className="font-options">
                      {['small', 'medium', 'large'].map(size => (
                        <button
                          key={size}
                          onClick={() => handleChange(null, 'fontSize', size)}
                          className={`btn-secondary-k ${settings.fontSize === size ? 'active' : ''}`}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="preview-section">
                    <h3>Live Preview</h3>
                    <div className={`theme-preview ${settings.darkMode ? 'dark-preview' : 'light-preview'}`}>
                      <div className="preview-card">
                        <div className="preview-header">
                          <div className="preview-avatar"></div>
                          <div className="preview-lines">
                            <div className="preview-line"></div>
                            <div className="preview-line short"></div>
                          </div>
                        </div>
                        <div className="preview-content">
                          <div className="preview-line"></div>
                          <div className="preview-line"></div>
                          <div className="preview-line short"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <button onClick={handleSave} disabled={saving} className="save-button">
                <FaSave />
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="modal-close">
                <FaTrash />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="form-input"
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="form-input"
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="form-input"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowPasswordModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleChangePassword} className="cancel-btn">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;