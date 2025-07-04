import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaGoogle, FaEdit, FaSave, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import Header from '../pages/header.jsx';
import Footer from '../pages/footer.jsx';
import './Profile.css';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const authProvider = localStorage.getItem('authProvider');
        
        if ((!token && !authProvider) || !storedUser) {
          navigate('/login');
          return;
        }

        const user = JSON.parse(storedUser);
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.displayName || 'User')}&background=random`;
        
        setUserData({
          ...user,
          name: user.displayName || user.name || 'User',
          email: user.email || 'No email provided',
          bio: user.bio || 'Tell us about yourself...',
          location: user.location || 'Not specified',
          lastLogin: user.lastLogin || new Date().toISOString(),
          createdAt: user.createdAt || new Date().toISOString(),
          isGoogleUser: authProvider === 'google',
          photoURL: user.photoURL || defaultAvatar
        });

        setFormData({
          name: user.displayName || user.name || '',
          bio: user.bio || '',
          location: user.location || ''
        });
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
        toast.error('Failed to load profile data');
        clearAuthData();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authProvider');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never logged in';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    clearAuthData();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleEditToggle = () => {
    if (userData?.isGoogleUser) {
      toast.info('Profile editing is limited for Google-authenticated users');
      return;
    }
    setEditing(!editing);
  };

  const handleCancelEdit = () => {
    setFormData({
      name: userData.name,
      bio: userData.bio,
      location: userData.location
    });
    setEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Validate form data
      if (!formData.name.trim()) {
        toast.error('Name cannot be empty');
        return;
      }

      const updatedUser = {
        ...userData,
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setEditing(false);
      
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="profile-container loading">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="profile-container error">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="btn retry-btn">
            Try Again
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="profile-container">
        <div className="profile-header-section">
          <h1>My Profile</h1>
          <div className="profile-actions">
            {!userData?.isGoogleUser && (
              <button 
                onClick={handleEditToggle} 
                className={`btn ${editing ? 'cancel-btn' : 'edit-btn'}`}
              >
                {editing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit Profile</>}
              </button>
            )}
          </div>
        </div>
        
        {userData ? (
          <div className="profile-content">
            <div className="profile-card">
              <div className="avatar-section">
                <div className="avatar-container">
                  <img 
                    src={userData.photoURL} 
                    alt="Profile" 
                    className="avatar-image" 
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`;
                    }}
                  />
                  {userData.isGoogleUser && (
                    <div className="google-badge" title="Google Account">
                      <FaGoogle />
                    </div>
                  )}
                </div>
                <h2 className="user-name">{userData.name}</h2>
                {!editing && (
                  <p className="user-bio">{userData.bio}</p>
                )}
              </div>

              <div className="details-section">
                <div className="detail-group">
                  <h3>Account Information</h3>
                  <div className="profile-field">
                    <label>Email:</label>
                    <div className="field-value">{userData.email}</div>
                  </div>
                  <div className="profile-field">
                    <label>Name:</label>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        maxLength={50}
                      />
                    ) : (
                      <div className="field-value">{userData.name}</div>
                    )}
                  </div>
                  <div className="profile-field">
                    <label>Last Login:</label>
                    <div className="field-value">{formatDate(userData.lastLogin)}</div>
                  </div>
                  <div className="profile-field">
                    <label>Member Since:</label>
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
                        maxLength={200}
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <div className="field-value bio-text">{userData.bio}</div>
                    )}
                  </div>
                  <div className="profile-field">
                    <label>Location:</label>
                    {editing ? (
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        maxLength={50}
                        placeholder="Where are you based?"
                      />
                    ) : (
                      <div className="field-value">{userData.location}</div>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="action-buttons">
                    <button onClick={handleCancelEdit} className="btn cancel-btn">
                      <FaTimes /> Cancel
                    </button>
                    <button onClick={handleSave} className="btn save-btn">
                      <FaSave /> Save Changes
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
      <Footer />
    </>
  );
}

export default Profile;