// Register.jsx - Enhanced Version with Email/Phone OTP Verification
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiLoader,
  FiMail,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
  FiShield,
  FiPhone,
  FiCornerDownLeft,
} from 'react-icons/fi';
import { setUser, setToken, clearError } from '../store/slices/authSlice';
import { apiClient } from '../utils/api';
import socketService from '../utils/socketService';
import './Register.css';

function Register() {
  // OTP Verification State
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMethod, setOtpMethod] = useState('email'); // 'email' or 'phone'
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [userEmailForOtp, setUserEmailForOtp] = useState('');
  const [userPhoneForOtp, setUserPhoneForOtp] = useState('');
  const [registrationData, setRegistrationData] = useState(null);
  const isSubmittingRef = useRef(false);
  
  // Set theme immediately on component render
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', initialTheme);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [touchedFields, setTouchedFields] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const formRef = useRef(null);
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
    if (error && !showOtpVerification) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch, showOtpVerification]);

  // Calculate password strength
  const calculatePasswordStrength = useCallback((password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'weak' };
    if (score <= 2) return { score: 2, label: 'Fair', color: 'fair' };
    if (score <= 3) return { score: 3, label: 'Good', color: 'good' };
    return { score: 4, label: 'Strong', color: 'strong' };
  }, []);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password, calculatePasswordStrength]);

  // Password validation checks
  const passwordChecks = useMemo(() => {
    const { password } = formData;
    return [
      { id: 'length', label: 'At least 6 characters', met: password.length >= 6 },
      { id: 'uppercase', label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { id: 'number', label: 'Contains number', met: /[0-9]/.test(password) },
      { id: 'special', label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [formData.password]);

  // Email validation
  const isValidEmail = useCallback((email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  // Phone validation
  const isValidPhone = useCallback((phone) => {
    return /^[0-9]{10}$/.test(phone);
  }, []);

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.name.trim().length >= 2 &&
      isValidEmail(formData.email) &&
      (!formData.phone || isValidPhone(formData.phone)) && // Phone is optional
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  }, [formData, isValidEmail, isValidPhone]);

  // Field status for styling
  const getFieldStatus = useCallback((field) => {
    if (!touchedFields[field]) return '';
    
    switch (field) {
      case 'name':
        return formData.name.trim().length >= 2 ? 'valid' : 'invalid';
      case 'email':
        return isValidEmail(formData.email) ? 'valid' : 'invalid';
      case 'phone':
        return !formData.phone || isValidPhone(formData.phone) ? 'valid' : 'invalid';
      case 'password':
        return formData.password.length >= 6 ? 'valid' : 'invalid';
      case 'confirmPassword':
        return formData.confirmPassword === formData.password && formData.confirmPassword.length >= 6 
          ? 'valid' 
          : 'invalid';
      default:
        return '';
    }
  }, [touchedFields, formData, isValidEmail, isValidPhone]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  // Send OTP for verification
  const sendVerificationOtp = async (email, phone, method, token) => {
    setOtpLoading(true);
    try {
      const response = await apiClient.post('/auth/send-verification-otp', {
        email,
        phone,
        method,
        tempToken: token
      });

      if (response.data.success) {
        setOtpSent(true);
        setOtpMsg(`Verification OTP sent to your ${method === 'email' ? 'email' : 'phone'} successfully!`);
        setResendTimer(60);
        toast.success(`OTP sent to your ${method}`);
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

  // Handle form submission - Register first, then OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Mark all fields as touched
    setTouchedFields({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (formData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      // Register the user and get temp token (using apiClient to avoid Redux auto-redirect)
      const response = await apiClient.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone || '',
        password: formData.password,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }

      const result = response.data;

      // Store registration data and temp token
      setRegistrationData(result);
      setTempToken(result.tempToken);
      setUserEmailForOtp(formData.email.toLowerCase().trim());
      setUserPhoneForOtp(formData.phone || '');

      // Show OTP verification screen (OTP already sent by backend)
      setShowOtpVerification(true);
      toast.info('Please verify your account with OTP');

    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setOtpLoading(true);
    try {
      const response = await apiClient.post('/auth/resend-verification-otp', {
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

  // Change OTP method
  const changeOtpMethod = async (method) => {
    if (method === otpMethod) return;
    
    setOtpMethod(method);
    setOtpMsg('');
    setOtp('');
    
    // Resend OTP with new method
    if (tempToken) {
      setOtpLoading(true);
      try {
        const response = await apiClient.post('/auth/send-verification-otp', {
          email: userEmailForOtp,
          phone: userPhoneForOtp,
          method: method,
          tempToken: tempToken
        });
        
        if (response.data.success) {
          setOtpSent(true);
          setOtpMsg(`OTP sent to your ${method === 'email' ? 'email' : 'phone'}!`);
          setResendTimer(60);
        } else {
          setOtpMsg(response.data.message || 'Failed to send OTP');
        }
      } catch (error) {
        setOtpMsg(error.response?.data?.message || 'Failed to send OTP');
      } finally {
        setOtpLoading(false);
      }
    }
  };

  // Verify OTP and complete registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length < 4) {
      setOtpMsg('Please enter a valid OTP');
      return;
    }
    
    setOtpLoading(true);
    
    try {
      const response = await apiClient.post('/auth/verify-registration-otp', {
        tempToken: tempToken,
        otp: otp
      });
      
      if (response.data.success) {
        // Store final tokens
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        dispatch(setToken(response.data.token));
        dispatch(setUser(response.data.user));
        
        socketService.reconnectWithAuth(response.data.token);
        socketService.emitAuthRegister(response.data.user);
        
        toast.success('✅ Account verified successfully! Welcome aboard!');
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

  // Go back to registration form
  const handleBackToRegistration = () => {
    setShowOtpVerification(false);
    setOtp('');
    setOtpSent(false);
    setOtpMsg('');
    setResendTimer(0);
    setTempToken('');
  };

  // Handle Google OAuth success (bypass OTP for Google)
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true);
    try {
      const { data } = await apiClient.post('/auth/google', {
        credential: credentialResponse.credential,
        isSignUp: true,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      dispatch(setToken(data.token));
      dispatch(setUser(data.user));

      socketService.reconnectWithAuth(data.token);
      socketService.emitAuthRegister(data.user);

      toast.success('Google registration successful!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to process Google signup';
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Google OAuth error
  const handleGoogleError = useCallback(() => {
    toast.error('Google signup failed. Please try again.');
    setIsGoogleLoading(false);
  }, []);

  return (
    <div className="register-shell">
      <div className="register-bg-grid" aria-hidden="true">
        <div className="bg-blob" />
        <div className="bg-blob" />
        <div className="bg-blob" />
      </div>

      <div className="register-card">
        {/* Brand/Promo Section */}
        <div className="register-card__aside">
          <div className="brand-mark">
            <div className="brand-icon-wrap">
              <FiZap className="brand-icon" />
            </div>
            <div>
              <span className="brand-pill">EventPro</span>
              <p className="brand-tagline">Build, launch, and grow your events.</p>
            </div>
          </div>

          <div className="login-promo">
            <div className="promo-card">
              <div className="promo-icon">
                <FiCalendar />
              </div>
              <div>
                <strong>Create faster</strong>
                <p>Plan events with focused, intuitive flows.</p>
              </div>
            </div>
            <div className="promo-card">
              <div className="promo-icon">
                <FiUsers />
              </div>
              <div>
                <strong>Track attendance</strong>
                <p>See bookings update in real time.</p>
              </div>
            </div>
            <div className="promo-card">
              <div className="promo-icon">
                <FiTrendingUp />
              </div>
              <div>
                <strong>See revenue</strong>
                <p>Metrics at a glance across all events.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form Panel */}
        <section className="register-panel">
          <div className="register-header">
            <span className="eyebrow">
              <FiCheckCircle className="eyebrow-icon" />
              Join now
            </span>
            <h1>Create account</h1>
            <p className="register-subtitle">Sign up and start managing events today.</p>
          </div>

          {/* Show OTP Verification or Registration Form */}
          {!showOtpVerification ? (
            <>
              {/* Google Signup */}
              <div className="social-signup-section">
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

              {/* Email Signup Form */}
              <form ref={formRef} onSubmit={handleSubmit} noValidate className="register-form">
                {/* Name Field */}
                <div className={`form-group ${focusedField === 'name' ? 'focused' : ''} ${getFieldStatus('name')}`}>
                  <label htmlFor="register-name">Full Name *</label>
                  <div className="input-shell search-input-wrapper">
                    <FiUser className="input-icon search-icon" />
                    &ensp;&ensp;
                    <input
                      id="register-name"
                      name="name"
                      type="text"
                      autoFocus
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => handleFocus('name')}
                      onBlur={() => handleBlur('name')}
                      autoComplete="name"
                      required
                    />
                    {getFieldStatus('name') === 'valid' && (
                      <FiCheckCircle className="validation-icon valid" />
                    )}
                  </div>
                  {getFieldStatus('name') === 'invalid' && (
                    <span className="field-error">Name must be at least 2 characters</span>
                  )}
                </div>

                {/* Email Field */}
                <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${getFieldStatus('email')}`}>
                  <label htmlFor="register-email">Email Address *</label>
                  <div className="input-shell search-input-wrapper">
                    <FiMail className="input-icon search-icon" />
                      &ensp;&ensp;
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      autoComplete="email"
                      required
                    />
                    {getFieldStatus('email') === 'valid' && (
                      <FiCheckCircle className="validation-icon valid" />
                    )}
                  </div>
                  {getFieldStatus('email') === 'invalid' && (
                    <span className="field-error">Please enter a valid email address</span>
                  )}
                </div>

                {/* Phone Field (Optional) */}
                <div className={`form-group ${focusedField === 'phone' ? 'focused' : ''} ${getFieldStatus('phone')}`}>
                  <label htmlFor="register-phone">Phone Number (Optional)</label>
                  <div className="input-shell search-input-wrapper">
                    <FiPhone className="input-icon search-icon" />
                      &ensp;&ensp;
                    <input
                      id="register-phone"
                      name="phone"
                      type="tel"
                      placeholder="1234567890"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={() => handleFocus('phone')}
                      onBlur={() => handleBlur('phone')}
                      autoComplete="tel"
                    />
                    {getFieldStatus('phone') === 'valid' && formData.phone && (
                      <FiCheckCircle className="validation-icon valid" />
                    )}
                  </div>
                  {getFieldStatus('phone') === 'invalid' && (
                    <span className="field-error">Please enter a valid 10-digit phone number</span>
                  )}
                  <small className="field-hint">Optional but recommended for 2FA</small>
                </div>

                {/* Password Field */}
                <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${getFieldStatus('password')}`}>
                  <label htmlFor="register-password">Password *</label>
                  <div className="input-shell search-input-wrapper">
                    <FiLock className="input-icon search-icon" />
                    &ensp;&ensp;
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      autoComplete="new-password"
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="password-strength-section">
                      <div className="password-strength-bar">
                        <div 
                          className={`strength-fill ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className={`strength-label ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}

                  {/* Password Requirements */}
                  {(focusedField === 'password' || touchedFields.password) && formData.password && (
                    <div className="password-checks">
                      {passwordChecks.map(check => (
                        <div key={check.id} className={`check-item ${check.met ? 'met' : ''}`}>
                          {check.met ? <FiCheck /> : <FiX />}
                          <span>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className={`form-group ${focusedField === 'confirmPassword' ? 'focused' : ''} ${getFieldStatus('confirmPassword')}`}>
                  <label htmlFor="register-confirmPassword">Confirm Password *</label>
                  <div className="input-shell  search-input-wrapper">
                    <FiLock className="input-icon search-icon" />
                    &ensp;&ensp;
                    <input
                      id="register-confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => handleFocus('confirmPassword')}
                      onBlur={() => handleBlur('confirmPassword')}
                      autoComplete="new-password"
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                    {getFieldStatus('confirmPassword') === 'valid' && (
                      <FiCheckCircle className="validation-icon valid" />
                    )}
                  </div>
                  {getFieldStatus('confirmPassword') === 'invalid' && formData.confirmPassword && (
                    <span className="field-error">Passwords do not match</span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`register-btn ${isSubmittingRef.current ? 'loading' : ''}`}
                  disabled={isSubmittingRef.current || !isFormValid}
                >
                  {isSubmittingRef.current ? (
                    <>
                      <FiLoader className="spinner" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <FiArrowRight className="btn-arrow" />
                    </>
                  )}
                </button>

                {/* Terms and Login Link */}
                <div className="terms-agreement">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms">Terms of Service</Link> and{' '}
                  <Link to="/privacy">Privacy Policy</Link>.
                </div>

                <div className="login-link">
                  Already have an account? <Link to="/login">Sign in</Link>
                </div>
              </form>
            </>
          ) : (
            /* OTP Verification Form */
            <form className="register-form" onSubmit={handleVerifyOtp}>
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToRegistration}
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
                <FiCornerDownLeft /> Back to registration
              </button>

              <div className="register-header" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Verify Your Account</h3>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Please verify your {otpMethod} to complete registration
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
                <label htmlFor="otp-input">Enter Verification Code</label>
                <div className="input-shell-k search-input-wrapper">
                  <FiShield className="input-icon search-icon" />
                  <input
                    id="otp-input"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className='search-input'
                    disabled={otpLoading}
                    autoComplete="off"
                    maxLength="6"
                    style={{ fontSize: '1.25rem', letterSpacing: '0.25rem', textAlign: 'center' }}
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
                className="register-btn"
                disabled={otpLoading || !otp || otp.length < 4}
              >
                {otpLoading ? (
                  <>
                    <FiLoader className="spinner" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Complete Registration</span>
                    <FiArrowRight className="btn-arrow" />
                  </>
                )}
              </button>

              {/* Resend OTP Button */}
              {!otpLoading && (
                <button
                  type="button"
                  className="resend-otp-btn"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  style={{
                    marginTop: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--primary-500)',
                    cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              )}

              <div className="login-link" style={{ marginTop: '1.5rem' }}>
                Already have an account? <Link to="/login">Sign in</Link>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default Register;