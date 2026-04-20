// Login.jsx - Two-Factor Authentication with OTP after Password
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Simple Dialog/Modal component
function Dialog({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">{title}</h3>
        <div className="dialog-message">{message}</div>
        <button className="dialog-close-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { 
  FiArrowRight, 
  FiEye, 
  FiEyeOff, 
  FiLock, 
  FiMail, 
  FiLoader,
  FiCheckCircle,
  FiZap,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiShield,
  FiPhone,
  FiMessageSquare,
  FiCornerDownLeft
} from 'react-icons/fi';
import { loginUser, setUser, setToken, clearError } from '../store/slices/authSlice';
import { apiClient } from '../utils/api';
import socketService from '../utils/socketService';
import './Login.css';

function Login() {
  // 2FA State
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMethod, setOtpMethod] = useState('email'); // 'email' or 'phone'
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [userEmailForOtp, setUserEmailForOtp] = useState('');
  const [userPhoneForOtp, setUserPhoneForOtp] = useState('');
  
  // Change Password Dialog State
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [changePwdForm, setChangePwdForm] = useState({ email: '', oldPassword: '', newPassword: '' });
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdMsg, setChangePwdMsg] = useState('');
  
  // Set theme immediately on component render
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', initialTheme);

  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [dialog, setDialog] = useState({ open: false, title: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [touchedFields, setTouchedFields] = useState({ 
    email: false, 
    password: false 
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const formRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const dialogJustClosedRef = useRef(false);
  const timerRef = useRef(null);
  
  const { loading: isLoading, error, isAuthenticated, initializing } = useSelector((state) => state.auth);

  // Set theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  // Redirect if already authenticated (but wait until auth is initialized)
  useEffect(() => {
    if (isAuthenticated && !initializing) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, initializing, navigate]);

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendTimer]);

  // Handle auth errors
  useEffect(() => {
    if (error && !dialogJustClosedRef.current && !showOtpInput) {
      if (typeof error === 'string') {
        if (error.toLowerCase().includes('not found')) {
          setDialog({ open: true, title: 'User Not Found', message: 'No account exists with this email address.' });
        } else if (error.toLowerCase().includes('invalid') || error.toLowerCase().includes('wrong')) {
          setDialog({ open: true, title: 'Invalid Credentials', message: 'The email or password you entered is incorrect.' });
        } else {
          toast.error(error);
        }
      } else {
        toast.error('Login failed.');
      }
      dispatch(clearError());
      isSubmittingRef.current = false;
    }
  }, [error, dispatch, showOtpInput]);

  // Email validation
  const isValidEmail = useCallback((email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  // Phone validation
  const isValidPhone = useCallback((phone) => {
    return /^[0-9]{10}$/.test(phone);
  }, []);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle OTP change
  const handleOtpChange = useCallback((e) => {
    setOtp(e.target.value);
  }, []);

  // Handle field focus
  const handleFocus = useCallback((field) => {
    setFocusedField(field);
  }, []);

  // Handle field blur
  const handleBlur = useCallback((field) => {
    setFocusedField(null);
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  }, []);

  // Get field validation status
  const getFieldStatus = useCallback((field) => {
    if (!touchedFields[field]) return '';
    if (field === 'email') {
      return formData.email && isValidEmail(formData.email) ? 'valid' : 'invalid';
    }
    if (field === 'password') {
      return formData.password.length >= 6 ? 'valid' : 'invalid';
    }
    return '';
  }, [touchedFields, formData, isValidEmail]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return formData.email && 
           formData.password && 
           isValidEmail(formData.email) &&
           formData.password.length >= 6;
  }, [formData, isValidEmail]);

  // Handle login with password first, then OTP
  const handleLogin = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
      }
    }
    
    if (isSubmittingRef.current) return;
    
    setTouchedFields({ email: true, password: true });

    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    isSubmittingRef.current = true;

    try {
      // First, verify password and get temp token
      const response = await apiClient.post('/auth/verify-password', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });
      
      if (response.data.success) {
        // Password is correct, now send OTP
        setTempToken(response.data.tempToken);
        setUserEmailForOtp(response.data.user.email);
        setUserPhoneForOtp(response.data.user.phone || '');
        
        // Send OTP based on user's preferred method or default to email
        await sendOtpToUser(response.data.user.email, response.data.user.phone);
        
        setShowOtpInput(true);
        toast.info(`OTP sent to your ${otpMethod}`);
      } else {
        setDialog({ 
          open: true, 
          title: 'Login Failed', 
          message: 'Invalid email or password' 
        });
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (error) {
      console.error('Login error:', error);
      setDialog({ 
        open: true, 
        title: 'Login Failed', 
        message: error.response?.data?.message || 'Invalid email or password' 
      });
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Send OTP to user
  const sendOtpToUser = async (email, phone) => {
    setOtpLoading(true);
    try {
      const response = await apiClient.post('/auth/send-2fa-otp', {
        email,
        phone,
        method: otpMethod
      });
      
      if (response.data.success) {
        setOtpSent(true);
        setOtpMsg(`OTP sent to your ${otpMethod === 'email' ? 'email' : 'phone'} successfully!`);
        setResendTimer(60);
        toast.success(`OTP sent to your ${otpMethod}`);
      } else {
        setOtpMsg(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setOtpMsg(error.response?.data?.message || 'Failed to send OTP');
      toast.error('Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setOtpLoading(true);
    try {
      const response = await apiClient.post('/auth/resend-2fa-otp', {
        tempToken: tempToken,
        method: otpMethod
      });
      
      if (response.data.success) {
        setOtpSent(true);
        setOtpMsg(`OTP resent to your ${otpMethod === 'email' ? 'email' : 'phone'}!`);
        setResendTimer(60);
        toast.success('OTP resent successfully');
      } else {
        setOtpMsg(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      setOtpMsg(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length < 4) {
      setOtpMsg('Please enter a valid OTP');
      return;
    }
    
    setOtpLoading(true);
    
    try {
      const response = await apiClient.post('/auth/verify-2fa', {
        tempToken: tempToken,
        otp: otp
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        dispatch(setToken(response.data.token));
        dispatch(setUser(response.data.user));
        
        socketService.reconnectWithAuth(response.data.token);
        socketService.emitAuthLogin(response.data.user);
        
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        setOtpMsg(response.data.message || 'Invalid OTP');
        toast.error('Invalid OTP');
      }
    } catch (error) {
      setOtpMsg(error.response?.data?.message || 'Failed to verify OTP');
      toast.error('OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  // Change OTP method
  const changeOtpMethod = async (method) => {
    if (method === otpMethod) return;
    
    setOtpMethod(method);
    setOtpMsg('');
    setOtp('');
    
    // Resend OTP with new method
    if (tempToken) {
      await handleResendOtp();
    }
  };

  // Go back to password entry
  const handleBackToPassword = () => {
    setShowOtpInput(false);
    setOtp('');
    setOtpSent(false);
    setOtpMsg('');
    setResendTimer(0);
    setTempToken('');
    setFormData(prev => ({ ...prev, password: '' }));
  };

  // Handle demo login (bypass OTP for demo)
  const handleDemoLogin = async () => {
    if (isSubmittingRef.current) return;
    
    setIsLoadingDemo(true);
    isSubmittingRef.current = true;
    
    try {
      const demoCredentials = {
        email: 'demo@eventpro.com',
        password: 'demo123456'
      };
      
      const result = await dispatch(loginUser(demoCredentials));
      
      if (loginUser.fulfilled.match(result)) {
        socketService.reconnectWithAuth(result.payload.token);
        socketService.emitAuthLogin(result.payload.user);
        navigate('/dashboard');
      } else {
        toast.error('Demo login failed. Please try again.');
      }
    } catch (error) {
      toast.error('Demo login failed. Please try again.');
    } finally {
      setIsLoadingDemo(false);
      isSubmittingRef.current = false;
    }
  };

  // Handle Google OAuth success (bypass OTP for Google)
  const handleGoogleSuccess = async (credentialResponse) => {
    if (isSubmittingRef.current) return;
    
    setIsGoogleLoading(true);
    isSubmittingRef.current = true;
    
    try {
      const { data } = await apiClient.post('/auth/google', {
        credential: credentialResponse.credential,
        isSignUp: false,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      dispatch(setToken(data.token));
      dispatch(setUser(data.user));

      socketService.reconnectWithAuth(data.token);
      socketService.emitAuthLogin(data.user);

      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to process Google login';
      setDialog({ open: true, title: 'Google Sign-In Failed', message });
    } finally {
      setIsGoogleLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Handle Google OAuth error
  const handleGoogleError = useCallback(() => {
    setDialog({ open: true, title: 'Google Sign-In Failed', message: 'Google login failed. Please try again.' });
    setIsGoogleLoading(false);
    isSubmittingRef.current = false;
  }, []);

  // Handle forgot password
  const handleForgotPassword = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('📧 Password reset feature coming soon! Please contact support.');
  }, []);

  // Handle change password dialog open
  const handleOpenChangePwd = () => {
    setChangePwdForm({ email: formData.email, oldPassword: '', newPassword: '' });
    setChangePwdMsg('');
    setChangePwdOpen(true);
  };

  // Handle change password submit
  const handleChangePwdSubmit = async (e) => {
    e.preventDefault();
    setChangePwdLoading(true);
    setChangePwdMsg('');
    try {
      await apiClient.post('/auth/change-password', changePwdForm);
      setChangePwdMsg('Password changed successfully!');
      setTimeout(() => setChangePwdOpen(false), 1200);
    } catch (err) {
      setChangePwdMsg(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setChangePwdLoading(false);
    }
  };

  // Dialog close handler
  const handleDialogClose = () => {
    dialogJustClosedRef.current = true;
    setDialog(prev => ({ ...prev, open: false }));
    setFormData(prev => ({ ...prev, password: '' }));
    setTouchedFields(prev => ({ ...prev, password: false }));
    setFocusedField(null);
    isSubmittingRef.current = false;
    
    setTimeout(() => {
      dialogJustClosedRef.current = false;
    }, 300);
  };

  // Handle form keypress
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isSubmittingRef.current && isFormValid() && !showOtpInput) {
      e.preventDefault();
      e.stopPropagation();
      handleLogin(e);
    }
  }, [isFormValid, showOtpInput]);

  return (
    <div className="login-shell">
      {/* Dialog for errors */}
      <Dialog 
        open={dialog.open} 
        title={dialog.title} 
        message={dialog.message} 
        onClose={handleDialogClose} 
      />
      
      {/* Animated Background */}
      <div className="login-bg-grid" aria-hidden="true">
        <div className="bg-blob" />
        <div className="bg-blob" />
        <div className="bg-blob" />
      </div>

      <div className="login-card">
        {/* Brand/Promo Section */}
        <div className="login-card__aside">
          <div className="brand-mark">
            <div className="brand-icon-wrap">
              <FiZap className="brand-icon" />
            </div>
            <div>
              <span className="brand-pill">EventPro</span>
              <p className="brand-tagline">Events, tickets, and attendees in one place.</p>
            </div>
          </div>

          <div className="login-promo">
            <div className="promo-card">
              <div className="promo-icon">
                <FiCalendar />
              </div>
              <div>
                <strong>Plan faster</strong>
                <p>Create events with focused, intuitive workflows.</p>
              </div>
            </div>
            <div className="promo-card">
              <div className="promo-icon">
                <FiUsers />
              </div>
              <div>
                <strong>Track attendance</strong>
                <p>Live ticket and attendee updates in real-time.</p>
              </div>
            </div>
            <div className="promo-card">
              <div className="promo-icon">
                <FiTrendingUp />
              </div>
              <div>
                <strong>See revenue</strong>
                <p>Sales, charts, and capacity at a glance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form Panel */}
        <section className="login-panel">
          <div className="login-header">
            <span className="eyebrow">
              <FiCheckCircle className="eyebrow-icon" />
              Welcome back
            </span>
            <h1>Sign in</h1>
            <p className="login-subtitle">Use your account to continue to your dashboard.</p>
          </div>

          {/* Google Login */}
          <div className="social-login-section">
            <div className="social-caption">Continue with Google</div>
            <div className={`google-login-wrapper ${isGoogleLoading ? 'loading' : ''}`}>
              {isGoogleLoading && (
                <div className="google-loading-overlay">
                  <FiLoader className="spinner" />
                </div>
              )}
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

          {/* Divider */}
          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">OR</span>
            <span className="divider-line" />
          </div>

          {/* Login Form - Password First, then OTP */}
          {!showOtpInput ? (
            <form 
              ref={formRef} 
              onSubmit={handleLogin} 
              onKeyPress={handleKeyPress}
              noValidate 
              className="login-form"
              action="javascript:void(0);"
            >
              {/* Email Field */}
              <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${getFieldStatus('email')}`}> 
                <label htmlFor="login-email">Email Address</label>
                <div className="input-shell ">
                  <FiMail className="input-icon search-icon" />
                    &ensp;&ensp;
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    autoComplete="email"
                    required
                    className='search-input'
                    disabled={isSubmittingRef.current}
                  />
                  {getFieldStatus('email') === 'valid' && (
                    <FiCheckCircle className="validation-icon valid" />
                  )}
                </div>
                {getFieldStatus('email') === 'invalid' && (
                  <span className="field-error">Please enter a valid email address</span>
                )}
              </div>

              {/* Password Field */}
              <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${getFieldStatus('password')}`}> 
                <label htmlFor="login-password">Password</label>
                <div className="input-shell ">
                  <FiLock className="input-icon search-icon" />
                    &ensp;&ensp;
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    autoComplete="current-password"
                    required
                    minLength="6"
                    className='search-input'
                    disabled={isSubmittingRef.current}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmittingRef.current}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Forgot/Change Password Links */}
              <div className="form-meta" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="forgot-btn" 
                  onClick={handleForgotPassword}
                  disabled={isSubmittingRef.current}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  className="change-pwd-btn"
                  onClick={handleOpenChangePwd}
                  disabled={isSubmittingRef.current}
                  style={{ color: 'var(--primary-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Change password
                </button>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={`login-btn ${isLoading ? 'loading' : ''}`} 
                disabled={isLoading || !isFormValid() || isSubmittingRef.current}
              >
                {isLoading ? (
                  <>
                    <FiLoader className="spinner" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <FiArrowRight className="btn-icon" />
                  </>
                )}
              </button>

              {/* Demo Login Button */}
            

              {/* Sign Up Link */}
              <p className="login-links">
                Don&apos;t have an account? <Link to="/register">Create one</Link>
              </p>
            </form>
          ) : (
            /* OTP Verification Form */
            <form className="login-form" onSubmit={handleVerifyOtp}>
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-500)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}
              >
                <FiCornerDownLeft /> Back to login
              </button>

              <div className="login-header" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Two-Factor Authentication</h3>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Enter the OTP sent to your {otpMethod}
                </p>
              </div>

              {/* OTP Method Selection */}
              <div className="otp-method-selector" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => changeOtpMethod('email')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: otpMethod === 'email' ? 'var(--primary-500)' : 'transparent',
                    color: otpMethod === 'email' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FiMail /> Email
                </button>
                <button
                  type="button"
                  onClick={() => changeOtpMethod('phone')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: otpMethod === 'phone' ? 'var(--primary-500)' : 'transparent',
                    color: otpMethod === 'phone' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  disabled={!userPhoneForOtp}
                >
                  <FiPhone /> Phone
                </button>
              </div>

              {/* OTP Field */}
              <div className="form-group">
                <label htmlFor="otp-input">Enter OTP</label>
                <div className="input-shell-k search-input-wrapper">
                  <FiShield className="input-icon search-icon" />
                  <input
                    id="otp-input"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={handleOtpChange}
                    required
                    className='search-input'
                    disabled={otpLoading}
                    autoComplete="off"
                    maxLength="6"
                    style={{ fontSize: '1.25rem', letterSpacing: '0.25rem' }}
                  />
                </div>
              </div>

              {/* OTP Message */}
              {otpMsg && (
                <div style={{ 
                  color: otpMsg.includes('success') ? '#10b981' : '#ef4444', 
                  marginBottom: '0.75rem',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}>
                  {otpMsg}
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                className="login-btn"
                disabled={otpLoading || !otp || otp.length < 4}
              >
                {otpLoading ? (
                  <>
                    <FiLoader className="spinner" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <FiArrowRight className="btn-icon" />
                  </>
                )}
              </button>

              {/* Resend OTP Button */}
              {!otpLoading && (
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  style={{ marginTop: '0.75rem' }}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              )}
            </form>
          )}
        </section>
      </div>

      {/* Change Password Dialog */}
      {changePwdOpen && (
        <div className="dialog-backdrop" onClick={() => setChangePwdOpen(false)}>
          <div className="dialog-box" onClick={e => e.stopPropagation()} style={{ minWidth: 320, maxWidth: 400 }}>
            <h3 className="dialog-title">Change Password</h3>
            <form onSubmit={handleChangePwdSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                placeholder="Email"
                value={changePwdForm.email}
                onChange={e => setChangePwdForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
                style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}
              />
              <input
                type="password"
                placeholder="Old Password"
                value={changePwdForm.oldPassword}
                onChange={e => setChangePwdForm(f => ({ ...f, oldPassword: e.target.value }))}
                required
                minLength={6}
                autoComplete="current-password"
                style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}
              />
              <input
                type="password"
                placeholder="New Password"
                value={changePwdForm.newPassword}
                onChange={e => setChangePwdForm(f => ({ ...f, newPassword: e.target.value }))}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}
              />
              <button
                type="submit"
                className="login-btn"
                disabled={changePwdLoading}
                style={{ marginTop: 8 }}
              >
                {changePwdLoading ? 'Changing...' : 'Change Password'}
              </button>
              {changePwdMsg && (
                <div style={{ color: changePwdMsg.includes('success') ? 'green' : 'red', fontWeight: 500, marginTop: 4 }}>{changePwdMsg}</div>
              )}
            </form>
            <button className="dialog-close-btn" style={{ marginTop: 12 }} onClick={() => setChangePwdOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;