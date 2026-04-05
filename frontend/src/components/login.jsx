import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { FiArrowRight, FiBarChart2, FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiUsers, FiCalendar } from 'react-icons/fi';
import { apiClient } from '../utils/api';
import './Login.css';

function Login() {
  const [loginInfo, setLoginInfo] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginInfo.email || !loginInfo.password) {
      toast.error('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/auth/login', loginInfo);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(data.message || 'Login successful');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await apiClient.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Google login successful!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to process Google login';
      toast.error(message);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
  };

  const handleForgotPassword = () => {
    toast.info('Password reset is not configured yet');
  };

  return (
    <div className="login-bg-container">
      <div className="login-overlay" />

      <div className="login-content">
        <section className="login-image-container" aria-hidden="true">
          <div className="image-overlay">
            <span className="brand-pill">EventPro</span>
            <h2>One place to manage events, tickets, and attendees.</h2>
            <p>Launch, track, and grow your events with a dashboard designed for speed and clarity.</p>

            <div className="hero-cards">
              <div className="hero-card">
                <FiCalendar className="hero-card-icon" />
                <strong>Plan Faster</strong>
                <span>Simple workflows for event creation and scheduling.</span>
              </div>
              <div className="hero-card">
                <FiUsers className="hero-card-icon" />
                <strong>Track Attendance</strong>
                <span>Live ticket and attendee updates from backend data.</span>
              </div>
              <div className="hero-card">
                <FiBarChart2 className="hero-card-icon" />
                <strong>See Revenue</strong>
                <span>Monitor sales, charts, and capacity at a glance.</span>
              </div>
            </div>

            <div className="hero-highlights">
              <div className="hero-highlight"><span className="hero-icon"><FiShield /></span> Secure authentication</div>
              <div className="hero-highlight"><span className="hero-icon"><FiBarChart2 /></span> Real-time event metrics</div>
              <div className="hero-highlight"><span className="hero-icon"><FiUsers /></span> Admin and organiser access</div>
            </div>
          </div>
        </section>

        <section className="login-box">
          <div className="login-header">
            <span className="eyebrow">Welcome back</span>
            <h1>Sign in</h1>
            <p className="login-subtitle">Use your account to continue to your dashboard.</p>
          </div>

          <div className="social-login-section">
            <div className="social-caption">Continue with Google</div>
            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="100%"
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>
          </div>

          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">OR</span>
            <span className="divider-line" />
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-shell">
                <FiMail className="input-icon" />
                <input
                  onChange={handleChange}
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={loginInfo.email}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-shell">
                <FiLock className="input-icon" />
                <input
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={loginInfo.password}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-meta">
              <button type="button" className="forgot-btn" onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              <span>{isLoading ? 'Signing in...' : 'Login'}</span>
              {!isLoading && <FiArrowRight />}
            </button>

            <p className="login-links">
              Don&apos;t have an account? <Link to="/register">Create one</Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Login;
