import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaGoogle, FaEdit, FaSave, FaSignOutAlt, FaTimes, FaUserShield, FaPhoneAlt, FaMapMarkerAlt, FaUser, FaEnvelope, FaCalendarAlt, FaClock, FaArrowLeft } from 'react-icons/fa';
import Header from '../pages/header.jsx';
import Footer from '../pages/footer.jsx';
import { logoutUser, updateProfile } from '../store/slices/authSlice';
import './Profile.css';

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    phone: '',
    avatar: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      // Get auth provider from localStorage or determine from user data
      const authProvider = localStorage.getItem('authProvider') || 
        (user.authProvider === 'google' ? 'google' : 'local');

        console.log('User data:', user);
      
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.displayName || 'User')}&background=6366f1&color=fff&bold=true`;
      console.log('Setting user data with avatar:',user);
      setUserData({
        id: user._id,
        name: user.displayName || user.name || 'User',
        email: user.email || 'No email provided',
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || '',
        avatar: user.avatar || defaultAvatar,
        status: user.status || 'active',
        role: user.role || 'booker',
        lastLogin: user.lastLogin || new Date().toISOString(),
        createdAt: user.createdAt || new Date().toISOString(),
        isGoogleUser: authProvider === 'google',
      });

      setFormData({
        name: user.displayName || user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || '',
        avatar: user.avatar || defaultAvatar
      });
      
      setLoading(false);
    }
  }, [user, isAuthenticated, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never logged in';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      localStorage.removeItem('authProvider');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleEditToggle = () => {
    if (!editing) {
      setFormData({
        name: userData.name,
        bio: userData.bio,
        location: userData.location,
        phone: userData.phone,
        avatar: userData.avatar
      });
      setAvatarFile(null);
      setAvatarPreview(null);
    }
    setEditing(!editing);
  };

  console.log(formData);

  const handleCancelEdit = () => {
    setFormData({
      name: userData.name,
      bio: userData.bio,
      location: userData.location,
      phone: userData.phone,
      avatar: userData.avatar
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload an image file');
          return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      let payload;
      if (avatarFile) {
        payload = new FormData();
        payload.append('name', formData.name.trim());
        payload.append('bio', formData.bio?.trim() || '');
        payload.append('location', formData.location?.trim() || '');
        payload.append('phone', formData.phone?.trim() || '');
        payload.append('avatar', avatarFile);
      } else {
        payload = {
          name: formData.name.trim(),
          bio: formData.bio?.trim() || '',
          location: formData.location?.trim() || '',
          phone: formData.phone?.trim() || '',
          avatar: formData.avatar || ''
        };
      }

      const result = await dispatch(updateProfile(payload)).unwrap();
      
      // Update local user data
      setUserData(prev => ({
        ...prev,
        name: formData.name.trim(),
        bio: formData.bio?.trim() || '',
        location: formData.location?.trim() || '',
        phone: formData.phone?.trim() || '',
        avatar: result.avatar || (avatarPreview || formData.avatar)
      }));
      
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Cleanup avatar preview URL
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (loading || authLoading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container loading">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        
        <div className="profile-container error">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="btn retry-btn">
            Try Again
          </button>
        </div>
        <Footer />
      </div>
    );
  }
console.log('Rendering profile with userData:', userData);
  return (
    <div className="profile-page">
      <div className="profile-container">
         
        <div className="profile-header-section">
         <button onClick={() => navigate(-1)} className="btn-back">
            <FaArrowLeft /> Back
          </button>
          <br/>
          {/* <br/> */}
          <h1>My Profile</h1>
          <div className="profile-actions">
            <button 
              onClick={handleEditToggle} 
              className={`btn ${editing ? 'cancel-btn' : 'edit-btn'}`}
            >
              {editing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit Profile</>}
            </button>
            <button 
              onClick={handleLogout}
              className="btn logout-btn"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
        
        {userData ? (
          <div className="profile-content">
            <div className="profile-card">
              <div className="avatar-section">
                <div className="avatar-container">
                  <img
  src={
    userData.avatar
      ? userData.avatar.startsWith('http')
        ? userData.avatar
        : `${import.meta.env.VITE_BASE_URL}${userData.avatar}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=6366f1&color=fff&bold=true`
  }
  alt={userData.name}
  className="avatar-image"
  onError={(e) => {
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=6366f1&color=fff&bold=true`;
  }}
/>
                  {userData.isGoogleUser && (
                    <div className="google-badge" title="Google Account">
                      <FaGoogle />
                    </div>
                  )}
                </div>
                <h2 className="user-name">{userData.name}</h2>
                {!editing && userData.bio && (
                  <p className="user-bio">{userData.bio}</p>
                )}
                <div className="profile-badges">
                  <span className={`role-badge ${userData.role}`}>
                    <FaUserShield />
                    {userData.role}
                  </span>
                  <span className={`status-badge ${userData.status}`}>
                    {userData.status}
                  </span>
                </div>
              </div>

              <div className="details-section">
                <div className="detail-group">
                  <h3>Account Information</h3>
                  
                  <div className="profile-field">
                    <label><FaEnvelope /> Email:</label>
                    <div className="field-value">{userData.email}</div>
                  </div>
                  
                  <div className="profile-field">
                    <label><FaUser /> Name:</label>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        maxLength={50}
                        className="profile-input"
                      />
                    ) : (
                      <div className="field-value">{userData.name}</div>
                    )}
                  </div>
                  
                  <div className="profile-field">
                    <label><FaPhoneAlt /> Phone:</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength={20}
                        placeholder="Phone number"
                        className="profile-input"
                      />
                    ) : (
                      <div className="field-value">
                        {userData.phone || <span className="not-set">Not set</span>}
                      </div>
                    )}
                  </div>

                  {editing && (
                    <div className="profile-field">
                      <label>Avatar Image:</label>
                      <input
                        type="file"
                        name="avatar"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleInputChange}
                        className="profile-file-input"
                      />
                      <small className="file-hint">Max 5MB. JPG, PNG, or WEBP</small>
                    </div>
                  )}
                  
                  <div className="profile-field">
                    <label><FaCalendarAlt /> Member Since:</label>
                    <div className="field-value">{formatDate(userData.createdAt)}</div>
                  </div>
                </div>
                
                <div className="detail-group">
                  <h3>Personal Information</h3>
                  
                  <div className="profile-field">
                    <label>Bio:</label>
                    {editing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows="3"
                        maxLength={300}
                        placeholder="Tell us about yourself..."
                        className="profile-textarea"
                      />
                    ) : (
                      <div className="field-value bio-text">
                        {userData.bio || <span className="not-set">No bio added yet</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="profile-field">
                    <label><FaMapMarkerAlt /> Location:</label>
                    {editing ? (
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        maxLength={50}
                        placeholder="Where are you based?"
                        className="profile-input"
                      />
                    ) : (
                      <div className="field-value">
                        {userData.location || <span className="not-set">Not specified</span>}
                      </div>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="action-buttons">
                    <button onClick={handleCancelEdit} className="btn cancel-btn" disabled={saving}>
                      <FaTimes /> Cancel
                    </button>
                    <button onClick={handleSave} className="btn save-btn" disabled={saving}>
                      {saving ? (
                        <><div className="small-spinner"></div> Saving...</>
                      ) : (
                        <><FaSave /> Save Changes</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-data">
            <p>No profile data available</p>
            <button onClick={() => navigate('/login')} className="btn login-btn">
              Login to view profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;