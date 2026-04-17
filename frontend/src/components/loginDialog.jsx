// LoginDialog.jsx - Login as Modal Component
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
import socketService from '../utils/socketService';
import "./logindialog.css"
import { changePassword, clearError, completeLoginWith2FA, googleLogin, resendLoginOTP, verifyLoginOTP } from '../store/slices/authSlice';
import { FiArrowRight, FiCheckCircle, FiCornerDownLeft, FiEye, FiEyeOff, FiLoader, FiLock, FiMail, FiPhone, FiShield, FiZap } from 'react-icons/fi';

function LoginDialog({ isOpen, onClose, onSwitchToRegister }) {
  // 2FA State
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMethod, setOtpMethod] = useState('email');
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
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const formRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const dialogJustClosedRef = useRef(false);
  const timerRef = useRef(null);
  
  const { loading: isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      onClose();
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, onClose]);

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

  const isValidEmail = useCallback((email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleOtpChange = useCallback((e) => {
    setOtp(e.target.value);
  }, []);

  const handleFocus = useCallback((field) => {
    setFocusedField(field);
  }, []);

  const handleBlur = useCallback((field) => {
    setFocusedField(null);
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  }, []);

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

  const isFormValid = useCallback(() => {
    return formData.email && 
           formData.password && 
           isValidEmail(formData.email) &&
           formData.password.length >= 6;
  }, [formData, isValidEmail]);

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
      const result = await dispatch(completeLoginWith2FA({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        method: otpMethod
      }));

      if (completeLoginWith2FA.fulfilled.match(result)) {
        setTempToken(result.payload.tempToken);
        setUserEmailForOtp(result.payload.user.email);
        setUserPhoneForOtp(result.payload.user.phone || '');
        setShowOtpInput(true);
        toast.info(`OTP sent to your ${otpMethod}`);
      } else {
        setDialog({ 
          open: true, 
          title: 'Login Failed', 
          message: result.payload || 'Invalid email or password' 
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

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setOtpLoading(true);
    try {
      const result = await dispatch(resendLoginOTP({
        tempToken: tempToken,
        method: otpMethod
      }));
      
      if (resendLoginOTP.fulfilled.match(result)) {
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length < 4) {
      setOtpMsg('Please enter a valid OTP');
      return;
    }
    
    setOtpLoading(true);
    
    try {
      const result = await dispatch(verifyLoginOTP({
        tempToken: tempToken,
        otp: otp
      }));
      
      if (verifyLoginOTP.fulfilled.match(result)) {
        socketService.reconnectWithAuth(result.payload.token);
        socketService.emitAuthLogin(result.payload.user);
        
        toast.success('Login successful!');
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

  const changeOtpMethod = async (method) => {
    if (method === otpMethod) return;
    setOtpMethod(method);
    setOtpMsg('');
    setOtp('');
    if (tempToken) {
      await handleResendOtp();
    }
  };

  const handleBackToPassword = () => {
    setShowOtpInput(false);
    setOtp('');
    setOtpSent(false);
    setOtpMsg('');
    setResendTimer(0);
    setTempToken('');
    setFormData(prev => ({ ...prev, password: '' }));
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (isSubmittingRef.current) return;
    
    setIsGoogleLoading(true);
    isSubmittingRef.current = true;
    
    try {
      const result = await dispatch(googleLogin({
        credential: credentialResponse.credential,
        isSignUp: false
      }));

      if (googleLogin.fulfilled.match(result)) {
        socketService.reconnectWithAuth(result.payload.token);
        socketService.emitAuthLogin(result.payload.user);

        toast.success('Login successful!');
        onClose();
        navigate('/dashboard');
      } else {
        setDialog({ open: true, title: 'Google Sign-In Failed', message: result.payload });
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to process Google login';
      setDialog({ open: true, title: 'Google Sign-In Failed', message });
    } finally {
      setIsGoogleLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleGoogleError = useCallback(() => {
    setDialog({ open: true, title: 'Google Sign-In Failed', message: 'Google login failed. Please try again.' });
    setIsGoogleLoading(false);
    isSubmittingRef.current = false;
  }, []);

  const handleForgotPassword = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('📧 Password reset feature coming soon! Please contact support.');
  }, []);

  const handleOpenChangePwd = () => {
    setChangePwdForm({ email: formData.email, oldPassword: '', newPassword: '' });
    setChangePwdMsg('');
    setChangePwdOpen(true);
  };

  const handleChangePwdSubmit = async (e) => {
    e.preventDefault();
    setChangePwdLoading(true);
    setChangePwdMsg('');
    try {
      const result = await dispatch(changePassword({
        email: changePwdForm.email,
        currentPassword: changePwdForm.oldPassword,
        newPassword: changePwdForm.newPassword
      }));

      if (changePassword.fulfilled.match(result)) {
        setChangePwdMsg('Password changed successfully!');
        setTimeout(() => setChangePwdOpen(false), 1200);
      } else {
        setChangePwdMsg(result.payload || 'Failed to change password. Please try again.');
      }
    } catch (err) {
      setChangePwdMsg(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setChangePwdLoading(false);
    }
  };

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

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isSubmittingRef.current && isFormValid() && !showOtpInput) {
      e.preventDefault();
      e.stopPropagation();
      handleLogin(e);
    }
  }, [isFormValid, showOtpInput]);

  if (!isOpen) return null;

  return (
   <div className="lxm-overlay" onClick={onClose}>
  <div className="lxm-container" onClick={e => e.stopPropagation()}>
    <button className="lxm-close-btn" onClick={onClose}>
      X
    </button>
    
    <div className="lxm-content">
      {/* Dialog for errors */}
      <Dialog 
        open={dialog.open} 
        title={dialog.title} 
        message={dialog.message} 
        onClose={handleDialogClose} 
      />
      
      <div className="lxm-header">
        <div className="lxm-brand">
          <div className="lxm-brand-icon">
            <FiZap />
          </div>
          <h2 className="lxm-brand-title">Welcome Back</h2>
        </div>
        <p className="lxm-subtitle">Sign in to continue to your dashboard</p>
      </div>

      {/* Google Login */}
      <div className="lxm-social-section">
        <div className="lxm-google-wrapper">
          {isGoogleLoading && (
            <div className="lxm-google-loader">
              <FiLoader className="lxm-spinner" />
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

      <div className="lxm-divider">
        <span className="lxm-divider-line" />
        <span className="lxm-divider-text">OR</span>
        <span className="lxm-divider-line" />
      </div>

      {/* Login Form */}
      {!showOtpInput ? (
        <form onSubmit={handleLogin} onKeyPress={handleKeyPress} className="lxm-form">
          <div className="lxm-field">
            <label className="lxm-label">Email Address</label>
            <div className="lxm-input-group">
              <FiMail className="lxm-input-icon lxm-icon-left" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                className="lxm-input"
                required
              />
              {getFieldStatus('email') === 'valid' && (
                <FiCheckCircle className="lxm-input-icon lxm-icon-right lxm-icon-valid" />
              )}
            </div>
          </div>

          <div className="lxm-field">
            <label className="lxm-label">Password</label>
            <div className="lxm-input-group">
              <FiLock className="lxm-input-icon lxm-icon-left" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                className="lxm-input"
                required
              />
              <button
                type="button"
                className="lxm-password-toggle"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="lxm-actions">
            <button type="button" className="lxm-link lxm-link-forgot" onClick={handleForgotPassword}>
              Forgot password?
            </button>
            <button type="button" className="lxm-link lxm-link-change" onClick={handleOpenChangePwd}>
              Change password
            </button>
          </div>

          <button 
            type="submit" 
            className="lxm-submit-btn"
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? (
              <>
                <FiLoader className="lxm-spinner lxm-spinner-sm" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <FiArrowRight />
              </>
            )}
          </button>

          <p className="lxm-signup-text">
            Don't have an account?{' '}
            <button type="button" onClick={() => {
              onClose();
              onSwitchToRegister();
            }} className="lxm-signup-link">
              Create one
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="lxm-form">
          <button
            type="button"
            onClick={handleBackToPassword}
            className="lxm-back-btn"
          >
            <FiCornerDownLeft /> Back to login
          </button>

          <div className="lxm-otp-header">
            <h3 className="lxm-otp-title">Two-Factor Authentication</h3>
            <p className="lxm-otp-desc">Enter the OTP sent to your {otpMethod}</p>
          </div>

          <div className="lxm-otp-methods">
            <button
              type="button"
              onClick={() => changeOtpMethod('email')}
              className={`lxm-method-btn ${otpMethod === 'email' ? 'lxm-method-active' : ''}`}
            >
              <FiMail /> Email
            </button>
            <button
              type="button"
              onClick={() => changeOtpMethod('phone')}
              className={`lxm-method-btn ${otpMethod === 'phone' ? 'lxm-method-active' : ''} ${!userPhoneForOtp ? 'lxm-method-disabled' : ''}`}
              disabled={!userPhoneForOtp}
            >
              <FiPhone /> Phone
            </button>
          </div>

          <div className="lxm-field">
            <label className="lxm-label">Enter OTP</label>
            <div className="lxm-input-group">
              <FiShield className="lxm-input-icon lxm-icon-left" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={handleOtpChange}
                maxLength="6"
                autoComplete="off"
                className="lxm-input lxm-input-otp"
              />
            </div>
          </div>

          {otpMsg && (
            <div className={`lxm-message ${otpMsg.includes('success') ? 'lxm-message-success' : 'lxm-message-error'}`}>
              {otpMsg}
            </div>
          )}

          <button
            type="submit"
            className="lxm-submit-btn"
            disabled={otpLoading || !otp || otp.length < 4}
          >
            {otpLoading ? (
              <>
                <FiLoader className="lxm-spinner lxm-spinner-sm" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Sign In</span>
                <FiArrowRight />
              </>
            )}
          </button>

          {!otpLoading && (
            <button
              type="button"
              className="lxm-resend-btn"
              onClick={handleResendOtp}
              disabled={resendTimer > 0}
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </button>
          )}
        </form>
      )}
    </div>

    {/* Change Password Dialog */}
    {changePwdOpen && (
      <div className="lxm-dialog-overlay" onClick={() => setChangePwdOpen(false)}>
        <div className="lxm-dialog" onClick={e => e.stopPropagation()}>
          <h3 className="lxm-dialog-title">Change Password</h3>
          <form onSubmit={handleChangePwdSubmit} className="lxm-dialog-form">
            <input
              type="email"
              placeholder="Email"
              value={changePwdForm.email}
              onChange={e => setChangePwdForm(f => ({ ...f, email: e.target.value }))}
              className="lxm-dialog-input"
              required
            />
            <input
              type="password"
              placeholder="Old Password"
              value={changePwdForm.oldPassword}
              onChange={e => setChangePwdForm(f => ({ ...f, oldPassword: e.target.value }))}
              className="lxm-dialog-input"
              required
            />
            <input
              type="password"
              placeholder="New Password"
              value={changePwdForm.newPassword}
              onChange={e => setChangePwdForm(f => ({ ...f, newPassword: e.target.value }))}
              className="lxm-dialog-input"
              required
            />
            <button type="submit" className="lxm-dialog-btn" disabled={changePwdLoading}>
              {changePwdLoading ? 'Changing...' : 'Change Password'}
            </button>
            {changePwdMsg && <div className="lxm-dialog-msg">{changePwdMsg}</div>}
          </form>
          <button className="lxm-dialog-close" onClick={() => setChangePwdOpen(false)}>Cancel</button>
        </div>
      </div>
    )}
  </div>
</div>
  );
}

export default LoginDialog;