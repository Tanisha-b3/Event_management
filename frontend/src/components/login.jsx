import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from './utils.jsx';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import "./Login.css";
import Header from '../pages/header.jsx';
import Footer from '../pages/footer.jsx';

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({
    google: false,
    facebook: false
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo({ ...loginInfo, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;

    if (!email || !password) {
      return handleError('Email and password are required');
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginInfo)
      });

      const result = await response.json();
      
      if (response.ok) {
        handleSuccess(result.message || 'Login successful');
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/dashboard');
      } else {
        handleError(result.error || result.message || 'Login failed');
      }
    } catch (err) {
      handleError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading({ ...socialLoading, google: true });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Store basic user info in local storage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      }));
      localStorage.setItem('authProvider', 'google');
      
      handleSuccess('Logged in with Google successfully');
      navigate('/dashboard');
    } catch (err) {
      handleError(err.message || 'Google login failed');
    } finally {
      setSocialLoading({ ...socialLoading, google: false });
    }
  };

  const handleFacebookLogin = async () => {
    setSocialLoading({ ...socialLoading, facebook: true });
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      // Store basic user info in local storage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      }));
      localStorage.setItem('authProvider', 'facebook');
      
      handleSuccess('Logged in with Facebook successfully');
      navigate('/dashboard');
    } catch (err) {
      handleError(err.message || 'Facebook login failed');
    } finally {
      setSocialLoading({ ...socialLoading, facebook: false });
    }
  };

  return (
    <>
      <div className='login-bg-container'>
        <div className='login-overlay'></div>
        
        <div className='login-content'>
          <div className='login-box'>
            <h1>EVENT PRO</h1>
            <p className="login-subtitle">Sign in to manage your events</p>
            
            <div className="social-login-buttons">
              <button 
                className="social-btn google-btn"
                onClick={handleGoogleLogin}
                disabled={socialLoading.google}
              >
                <FcGoogle className="social-icon" />
                {socialLoading.google ? 'Signing in...' : 'Continue with Google'}
              </button>
              
              <button 
                className="social-btn facebook-btn"
                onClick={handleFacebookLogin}
                disabled={socialLoading.facebook}
              >
                <FaFacebook className="social-icon" />
                {socialLoading.facebook ? 'Signing in...' : 'Continue with Facebook'}
              </button>
            </div>
            
            <div className="divider">
              <span className="divider-line"></span>
              <span className="divider-text">OR</span>
              <span className="divider-line"></span>
            </div>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor='email'>Email</label>
                <input
                  onChange={handleChange}
                  type='email'
                  name='email'
                  placeholder='Enter your email...'
                  value={loginInfo.email}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor='password'>Password</label>
                <input
                  onChange={handleChange}
                  type='password'
                  name='password'
                  placeholder='Enter your password...'
                  value={loginInfo.password}
                  required
                />
              </div>
              <button 
                type='submit' 
                className="login-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
              
              <div className="login-links">
                <Link to='/forgot-password'>Forgot password?</Link>
                <span>
                  Don't have an account? <Link to='/register'>Sign up</Link>
                </span>
              </div>
            </form>
          </div>
        </div>
        <ToastContainer />
      </div>
    </>
  );
}

export default Login;