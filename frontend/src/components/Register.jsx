import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from './utils.jsx';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import Header from '../pages/header.jsx';
import Footer from '../pages/footer.jsx';
import './Register.css';
import loginImage from '../assets/loginImage.jpg';

// Firebase configuration (same as in Login)
// Initialize Firebase

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

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = signupInfo;

    if (!name || !email || !password) {
      return handleError('Name, email and password are required');
    }

    if (password !== confirmPassword) {
      return handleError('Passwords do not match');
    }

    setIsLoading(true);

    try {
      // Firebase email/password registration
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        name,
        email: user.email,
        createdAt: new Date().toISOString()
      }));
      localStorage.setItem('token', user.accessToken);

      handleSuccess('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      handleError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setSocialLoading({ ...socialLoading, google: true });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString()
      }));
      localStorage.setItem('token', user.accessToken);
      localStorage.setItem('authProvider', 'google');
      
      handleSuccess('Registered with Google successfully');
      navigate('/dashboard');
    } catch (err) {
      handleError(err.message || 'Google registration failed');
    } finally {
      setSocialLoading({ ...socialLoading, google: false });
    }
  };

  const handleFacebookSignup = async () => {
    setSocialLoading({ ...socialLoading, facebook: true });
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString()
      }));
      localStorage.setItem('token', user.accessToken);
      localStorage.setItem('authProvider', 'facebook');
      
      handleSuccess('Registered with Facebook successfully');
      navigate('/dashboard');
    } catch (err) {
      handleError(err.message || 'Facebook registration failed');
    } finally {
      setSocialLoading({ ...socialLoading, facebook: false });
    }
  };
  return (
    <>
      <div className='register-page-container'>
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
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Access content of various events</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Connects with social people</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Personalized dashboard</span>
                </div>
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
              <button 
                className="social-btn google-btn"
                onClick={handleGoogleSignup}
                disabled={socialLoading.google}
              >
                <FcGoogle className="social-icon" />
                {socialLoading.google ? 'Signing up...' : 'Continue with Google'}
              </button>
              
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
                  <span className="btn-loading">
                    <span className="spinner"></span> Creating account...
                  </span>
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
      </div>
      <ToastContainer />
    </>
  );
}

export default Register;