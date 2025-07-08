import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import {jwtDecode} from 'jwt-decode';
import './Login.css';

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
      toast.error('Email and password are required');
      return;
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
      console.log(result)
      if (response.ok) {
        toast.success(result.message || 'Login successful');
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/dashboard');
      } else {
        toast.error(result.error || result.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setSocialLoading({ ...socialLoading, google: true });
    
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Store user info
      localStorage.setItem('user', JSON.stringify({
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        authProvider: 'google'
      }));
      localStorage.setItem('token', credentialResponse.credential);

      toast.success('Google login successful!');
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

  const handleFacebookLogin = () => {
    toast.info('Facebook login is currently unavailable');
  };

  return (
    <div className='login-bg-container'>
      <div className='login-overlay'></div>
      
      <div className='login-content'>
        <div className='login-box'>
          <h1>EVENT PRO</h1>
          <p className="login-subtitle">Sign in to manage your events</p>
          
          <div className="social-login-buttons">
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
                  {socialLoading.google ? 'Signing in...' : 'Continue with Google'}
                </button>
              )}
            />
            
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
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

export default Login;