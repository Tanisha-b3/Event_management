import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './Register.css';
import loginImage from '../assets/loginImage.jpg';

function Register() {
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({
    google: false,
    facebook: false
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo({ ...signupInfo, [name]: value });
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword } = signupInfo;

    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

const handleSignup = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: signupInfo.name,
        email: signupInfo.email,
        password: signupInfo.password
      }),
    });

    // First check if response exists and is OK
    if (!response) {
      throw new Error('No response from server');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Store token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    toast.success('Registration successful!');
    navigate('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    toast.error(error.message || 'Registration failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
  const handleGoogleSuccess = (credentialResponse) => {
    setSocialLoading({ ...socialLoading, google: true });
    
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google user info:", decoded);

      // Store user data
      localStorage.setItem('user', JSON.stringify({
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        authProvider: 'google'
      }));
      localStorage.setItem('token', credentialResponse.credential);

      toast.success('Google registration successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error("Google login error:", error);
      toast.error('Failed to process Google login');
    } finally {
      setSocialLoading({ ...socialLoading, google: false });
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
    setSocialLoading({ ...socialLoading, google: false });
  };

  const handleFacebookSignup = () => {
    toast.info('Facebook registration is currently unavailable');
  };

  return (
    <div className='register-page-container'>
      {/* Image Section */}
      <div className='register-image-section'>
        <img 
          src={loginImage} 
          alt="People collaborating" 
          className='register-background-image'
        />
        <div className='register-image-overlay'>
          <div className="overlay-content">
            <h2>Join Our Community</h2>
            <p>Start your journey with us creating lots of events</p>
            <div className="benefits-list">
              {['Access content of various events', 'Connect with social people', 'Personalized dashboard'].map((benefit, index) => (
                <div className="benefit-item" key={index}>
                  <span className="benefit-icon">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Section */}
      <div className='register-form-container'>
        <div className='register-box'>
          <div className="register-header">
            <h1>Create Your Account</h1>
            <p className="register-subtitle">Join thousands of happy users</p>
          </div>
          
          <div className="social-signup-buttons">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              render={({ onClick }) => (
                <button
                  className="social-btn google-btn"
                  onClick={onClick}
                  disabled={socialLoading.google}
                >
                  <FcGoogle className="social-icon" />
                  {socialLoading.google ? 'Signing up...' : 'Continue with Google'}
                </button>
              )}
            />
            
            <button 
              className="social-btn facebook-btn"
              onClick={handleFacebookSignup}
              disabled={socialLoading.facebook}
            >
              <FaFacebook className="social-icon" />
              {socialLoading.facebook ? 'Signing up...' : 'Continue with Facebook'}
            </button>
          </div>
          
          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">or sign up with email</span>
            <span className="divider-line"></span>
          </div>
          
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor='name'>Full Name</label>
              <input
                onChange={handleChange}
                type='text'
                name='name'
                autoFocus
                placeholder='John Doe'
                value={signupInfo.name}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor='email'>Email Address</label>
              <input
                onChange={handleChange}
                type='email'
                name='email'
                placeholder='john@example.com'
                value={signupInfo.email}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor='password'>Password</label>
              <input
                onChange={handleChange}
                type='password'
                name='password'
                placeholder='At least 6 characters'
                value={signupInfo.password}
                required
                minLength="6"
              />
              <div className="password-hint">Must be at least 6 characters</div>
            </div>
            <div className="form-group">
              <label htmlFor='confirmPassword'>Confirm Password</label>
              <input
                onChange={handleChange}
                type='password'
                name='confirmPassword'
                placeholder='Re-enter your password'
                value={signupInfo.confirmPassword}
                required
                minLength="6"
              />
            </div>
            
            <button 
              type='submit' 
              className="register-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span> Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
            
            <div className="terms-agreement">
              By creating an account, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>
            </div>
            
            <div className="login-link">
              Already have an account? <Link to='/login'>Log in</Link>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

export default Register;