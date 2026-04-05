import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import {
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { apiClient } from '../utils/api';
import './Register.css';

function Register() {
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo((prev) => ({ ...prev, [name]: value }));
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
      const { data } = await apiClient.post('/auth/register', {
        name: signupInfo.name,
        email: signupInfo.email,
        password: signupInfo.password,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed. Please try again.';
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

      toast.success('Google registration successful!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to process Google login';
      toast.error(message);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
  };

  return (
    <div className="register-page-container">
      <div className="register-overlay" />

      <div className="register-content">
        <section className="register-image-section" aria-hidden="true">
          <div className="register-image-overlay">
            <span className="brand-pill">EventPro</span>
            <h2>Start creating, tracking, and growing events in one place.</h2>
            <p>Everything you need to launch events, manage tickets, and keep attendees engaged.</p>

            <div className="benefits-grid">
              <div className="benefit-card">
                <FiCalendar className="benefit-icon" />
                <strong>Create faster</strong>
                <span>Plan events with a clean and focused workflow.</span>
              </div>
              <div className="benefit-card">
                <FiUsers className="benefit-icon" />
                <strong>Track attendance</strong>
                <span>Monitor bookings and live attendee data from the backend.</span>
              </div>
              <div className="benefit-card">
                <FiBarChart2 className="benefit-icon" />
                <strong>See results</strong>
                <span>Keep an eye on sales, revenue, and capacity usage.</span>
              </div>
            </div>

            <div className="hero-highlights">
              <div className="hero-highlight"><span className="hero-icon"><FiShield /></span> Secure auth</div>
              <div className="hero-highlight"><span className="hero-icon"><FiBarChart2 /></span> Actionable analytics</div>
              <div className="hero-highlight"><span className="hero-icon"><FiUsers /></span> Organizer-ready tools</div>
            </div>
          </div>
        </section>

        <section className="register-box">
          <div className="register-header">
            <span className="eyebrow">Join now</span>
            <h1>Create account</h1>
            <p className="register-subtitle">Sign up and start managing events today.</p>
          </div>

          <div className="social-signup-section">
            <div className="social-caption">Continue with Google</div>
            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="100%"
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>
          </div>

          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">or sign up with email</span>
            <span className="divider-line" />
          </div>

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-shell">
                <FiUser className="input-icon" />
                <input
                  onChange={handleChange}
                  type="text"
                  name="name"
                  autoFocus
                  placeholder="John Doe"
                  value={signupInfo.name}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-shell">
                <FiMail className="input-icon" />
                <input
                  onChange={handleChange}
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={signupInfo.email}
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
                  placeholder="At least 6 characters"
                  value={signupInfo.password}
                  required
                  minLength="6"
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
              <div className="password-hint">Must be at least 6 characters</div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-shell">
                <FiLock className="input-icon" />
                <input
                  onChange={handleChange}
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={signupInfo.confirmPassword}
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="register-btn" disabled={isLoading}>
              <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
              {!isLoading && <FiArrowRight />}
            </button>

            <div className="terms-agreement">
              By creating an account, you agree to our Terms and Privacy Policy.
            </div>

            <div className="login-link">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Register;
