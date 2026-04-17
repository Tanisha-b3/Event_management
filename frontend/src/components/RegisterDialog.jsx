// RegisterDialog.jsx - Registration as Modal Component
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import socketService from '../utils/socketService';
import './RegisterDialog.css';

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
import { clearError, googleLogin, initiateRegistration, resendRegistrationOTP, sendRegistrationOTP, verifyRegistrationOTP } from '../store/slices/authSlice';

function RegisterDialog({ isOpen, onClose, onSwitchToLogin }) {
  // OTP Verification State
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMethod, setOtpMethod] = useState('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [userEmailForOtp, setUserEmailForOtp] = useState('');
  const [userPhoneForOtp, setUserPhoneForOtp] = useState('');
  const [registrationData, setRegistrationData] = useState(null);
  const isSubmittingRef = useRef(false);
  
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
  const contentRef = useRef(null);
  
  const { loading: isLoading, error, isAuthenticated, initializing } = useSelector((state) => state.auth);

  // Close modal and redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && !initializing) {
      onClose();
      navigate('/dashboard');
    }
  }, [isAuthenticated, initializing, navigate, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset scroll position when modal opens or content changes
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen, showOtpVerification]);

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

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password, calculatePasswordStrength]);

  const passwordChecks = useMemo(() => {
    const { password } = formData;
    return [
      { id: 'length', label: 'At least 6 characters', met: password.length >= 6 },
      { id: 'uppercase', label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { id: 'number', label: 'Contains number', met: /[0-9]/.test(password) },
      { id: 'special', label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [formData.password]);

  const isValidEmail = useCallback((email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const isValidPhone = useCallback((phone) => {
    return /^[0-9]{10}$/.test(phone);
  }, []);

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim().length >= 2 &&
      isValidEmail(formData.email) &&
      (!formData.phone || isValidPhone(formData.phone)) &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  }, [formData, isValidEmail, isValidPhone]);

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFocus = useCallback((field) => {
    setFocusedField(field);
  }, []);

  const handleBlur = useCallback((field) => {
    setFocusedField(null);
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setTouchedFields({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      isSubmittingRef.current = false;
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      isSubmittingRef.current = false;
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      isSubmittingRef.current = false;
      return;
    }
    if (formData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      isSubmittingRef.current = false;
      return;
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      isSubmittingRef.current = false;
      return;
    }

    try {
      const result = await dispatch(initiateRegistration({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone || '',
        password: formData.password,
      }));

      if (initiateRegistration.fulfilled.match(result)) {
        setRegistrationData(result.payload);
        setTempToken(result.payload.tempToken);
        setUserEmailForOtp(result.payload.email);
        setUserPhoneForOtp(result.payload.phone);
        setShowOtpVerification(true);
        toast.info('Please verify your account with OTP');
      } else {
        toast.error(result.payload || 'Registration failed. Please try again.');
      }

    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setOtpLoading(true);
    try {
      const result = await dispatch(resendRegistrationOTP({
        tempToken: tempToken,
        method: otpMethod
      }));
      
      if (resendRegistrationOTP.fulfilled.match(result)) {
        setOtpSent(true);
        setOtpMsg(`OTP resent to your ${otpMethod === 'email' ? 'email' : 'phone'}!`);
        setResendTimer(60);
        toast.success('OTP resent successfully');
      } else {
        setOtpMsg(result.payload || 'Failed to resend OTP');
      }
    } catch (error) {
      setOtpMsg(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const changeOtpMethod = async (method) => {
    if (method === otpMethod) return;
    
    setOtpMethod(method);
    setOtpMsg('');
    setOtp('');
    
    if (tempToken) {
      setOtpLoading(true);
      try {
        const result = await dispatch(sendRegistrationOTP({
          tempToken: tempToken,
          email: userEmailForOtp,
          phone: userPhoneForOtp,
          method: method
        }));
        
        if (sendRegistrationOTP.fulfilled.match(result)) {
          setOtpSent(true);
          setOtpMsg(`OTP sent to your ${method === 'email' ? 'email' : 'phone'}!`);
          setResendTimer(60);
        } else {
          setOtpMsg(result.payload || 'Failed to send OTP');
        }
      } catch (error) {
        setOtpMsg(error.response?.data?.message || 'Failed to send OTP');
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length < 4) {
      setOtpMsg('Please enter a valid OTP');
      return;
    }
    
    setOtpLoading(true);
    
    try {
      const result = await dispatch(verifyRegistrationOTP({
        tempToken: tempToken,
        otp: otp
      }));
      
      if (verifyRegistrationOTP.fulfilled.match(result)) {
        socketService.reconnectWithAuth(result.payload.token);
        socketService.emitAuthRegister(result.payload.user);
        
        toast.success('✅ Account verified successfully! Welcome aboard!');
        onClose();
        navigate('/dashboard');
      } else {
        setOtpMsg(result.payload || 'Invalid OTP');
        toast.error('Invalid OTP');
      }
    } catch (error) {
      setOtpMsg(error.response?.data?.message || 'Failed to verify OTP');
      toast.error('OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBackToRegistration = () => {
    setShowOtpVerification(false);
    setOtp('');
    setOtpSent(false);
    setOtpMsg('');
    setResendTimer(0);
    setTempToken('');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true);
    try {
      const result = await dispatch(googleLogin({
        credential: credentialResponse.credential,
        isSignUp: true
      }));

      if (googleLogin.fulfilled.match(result)) {
        socketService.reconnectWithAuth(result.payload.token);
        socketService.emitAuthRegister(result.payload.user);

        toast.success('Google registration successful!');
        onClose();
        navigate('/dashboard');
      } else {
        toast.error(result.payload || 'Failed to process Google signup');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to process Google signup';
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = useCallback(() => {
    toast.error('Google signup failed. Please try again.');
    setIsGoogleLoading(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="rgm-overlay" onClick={onClose}>
  <div className="rgm-container" onClick={e => e.stopPropagation()}>
    <button className="rgm-close-btn" onClick={onClose}>
     X
      </button>

    <div className="rgm-content" ref={contentRef}>
      {!showOtpVerification ? (
        <>
          <div className="rgm-header">
            <div className="rgm-brand">
              <div className="rgm-brand-icon">
                <FiZap />
              </div>
              <h2 className="rgm-brand-title">Create Account</h2>
            </div>
            <p className="rgm-subtitle">Join EventPro and start your journey</p>
          </div>

          {/* Google Signup */}
          <div className="rgm-social-section">
            <div className="rgm-google-wrapper">
              {isGoogleLoading && (
                <div className="rgm-google-loader">
                  <FiLoader className="rgm-spinner" />
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

          <div className="rgm-divider">
            <span className="rgm-divider-line" />
            <span className="rgm-divider-text">or sign up with email</span>
            <span className="rgm-divider-line" />
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="rgm-form">
            {/* Full Name Field */}
            <div className="rgm-field">
              <label className="rgm-label">Full Name *</label>
              <div className="rgm-input-group">
                <FiUser className="rgm-input-icon rgm-icon-left" />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => handleFocus('name')}
                  onBlur={() => handleBlur('name')}
                  className="rgm-input"
                  required
                />
                {getFieldStatus('name') === 'valid' && (
                  <FiCheckCircle className="rgm-input-icon rgm-icon-right rgm-icon-valid" />
                )}
              </div>
              {getFieldStatus('name') === 'invalid' && (
                <span className="rgm-error-msg">Name must be at least 2 characters</span>
              )}
            </div>

            {/* Email Field */}
            <div className="rgm-field">
              <label className="rgm-label">Email Address *</label>
              <div className="rgm-input-group">
                <FiMail className="rgm-input-icon rgm-icon-left" />
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  className="rgm-input"
                  required
                />
                {getFieldStatus('email') === 'valid' && (
                  <FiCheckCircle className="rgm-input-icon rgm-icon-right rgm-icon-valid" />
                )}
              </div>
              {getFieldStatus('email') === 'invalid' && (
                <span className="rgm-error-msg">Please enter a valid email address</span>
              )}
            </div>

            {/* Phone Field */}
            <div className="rgm-field">
              <label className="rgm-label">Phone Number (Optional)</label>
              <div className="rgm-input-group">
                <FiPhone className="rgm-input-icon rgm-icon-left" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  onFocus={() => handleFocus('phone')}
                  onBlur={() => handleBlur('phone')}
                  className="rgm-input"
                />
                {getFieldStatus('phone') === 'valid' && formData.phone && (
                  <FiCheckCircle className="rgm-input-icon rgm-icon-right rgm-icon-valid" />
                )}
              </div>
              {getFieldStatus('phone') === 'invalid' && (
                <span className="rgm-error-msg">Please enter a valid 10-digit phone number</span>
              )}
              <small className="rgm-hint">Optional but recommended for 2FA</small>
            </div>

            {/* Password Field */}
            <div className="rgm-field">
              <label className="rgm-label">Password *</label>
              <div className="rgm-input-group">
                <FiLock className="rgm-input-icon rgm-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  className="rgm-input"
                  required
                />
                <button
                  type="button"
                  className="rgm-password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              
              {formData.password && (
                <div className="rgm-strength-meter">
                  <div className="rgm-strength-bar">
                    <div 
                      className={`rgm-strength-fill rgm-strength-${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`rgm-strength-label rgm-strength-${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}

              {(focusedField === 'password' || touchedFields.password) && formData.password && (
                <div className="rgm-password-checks">
                  {passwordChecks.map(check => (
                    <div key={check.id} className={`rgm-check-item ${check.met ? 'rgm-check-met' : ''}`}>
                      {check.met ? <FiCheck /> : <FiX />}
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="rgm-field">
              <label className="rgm-label">Confirm Password *</label>
              <div className="rgm-input-group">
                <FiLock className="rgm-input-icon rgm-icon-left" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => handleFocus('confirmPassword')}
                  onBlur={() => handleBlur('confirmPassword')}
                  className="rgm-input"
                  required
                />
                <button
                  type="button"
                  className="rgm-password-toggle"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
                {getFieldStatus('confirmPassword') === 'valid' && (
                  <FiCheckCircle className="rgm-input-icon rgm-icon-right rgm-icon-valid" />
                )}
              </div>
              {getFieldStatus('confirmPassword') === 'invalid' && formData.confirmPassword && (
                <span className="rgm-error-msg">Passwords do not match</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="rgm-submit-btn"
              disabled={isSubmittingRef.current || !isFormValid}
            >
              {isSubmittingRef.current ? (
                <>
                  <FiLoader className="rgm-spinner rgm-spinner-sm" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight />
                </>
              )}
            </button>

            {/* Terms Agreement */}
            <div className="rgm-terms">
              By creating an account, you agree to our{' '}
              <button type="button" className="rgm-link-btn" onClick={() => window.open('/terms', '_blank')}>
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="rgm-link-btn" onClick={() => window.open('/privacy', '_blank')}>
                Privacy Policy
              </button>.
            </div>

            {/* Login Link */}
            <div className="rgm-footer-link">
              Already have an account?{' '}
              <button type="button" className="rgm-switch-link" onClick={() => {
                onClose();
                onSwitchToLogin();
              }}>
                Sign in
              </button>
            </div>
          </form>
        </>
      ) : (
        <form className="rgm-form" onSubmit={handleVerifyOtp}>
          <button
            type="button"
            onClick={handleBackToRegistration}
            className="rgm-back-btn"
          >
            <FiCornerDownLeft /> Back to registration
          </button>

          <div className="rgm-otp-header">
            <h3 className="rgm-otp-title">Verify Your Account</h3>
            <p className="rgm-otp-desc">Please verify your {otpMethod} to complete registration</p>
          </div>

          <div className="rgm-otp-methods">
            <button
              type="button"
              onClick={() => changeOtpMethod('email')}
              className={`rgm-method-btn ${otpMethod === 'email' ? 'rgm-method-active' : ''}`}
            >
              <FiMail /> Email
            </button>
            <button
              type="button"
              onClick={() => changeOtpMethod('phone')}
              className={`rgm-method-btn ${otpMethod === 'phone' ? 'rgm-method-active' : ''} ${!userPhoneForOtp ? 'rgm-method-disabled' : ''}`}
              disabled={!userPhoneForOtp}
            >
              <FiPhone /> Phone
            </button>
          </div>

          <div className="rgm-field">
            <label className="rgm-label">Enter Verification Code</label>
            <div className="rgm-input-group">
              <FiShield className="rgm-input-icon rgm-icon-left" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                autoComplete="off"
                className="rgm-input rgm-input-otp"
              />
            </div>
          </div>

          {otpMsg && (
            <div className={`rgm-message ${otpMsg.includes('success') ? 'rgm-message-success' : 'rgm-message-error'}`}>
              {otpMsg}
            </div>
          )}

          <button
            type="submit"
            className="rgm-submit-btn"
            disabled={otpLoading || !otp || otp.length < 4}
          >
            {otpLoading ? (
              <>
                <FiLoader className="rgm-spinner rgm-spinner-sm" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Complete Registration</span>
                <FiArrowRight />
              </>
            )}
          </button>

          {!otpLoading && (
            <button
              type="button"
              className="rgm-resend-btn"
              onClick={handleResendOtp}
              disabled={resendTimer > 0}
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </button>
          )}

          <div className="rgm-footer-link rgm-footer-link-top">
            Already have an account?{' '}
            <button type="button" className="rgm-switch-link" onClick={() => {
              onClose();
              onSwitchToLogin();
            }}>
              Sign in
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
</div>
  );
}

export default RegisterDialog;