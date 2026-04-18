import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper functions for localStorage
const saveToLocalStorage = (token, user) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
  
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    if (user._id || user.id) {
      localStorage.setItem('userId', user._id || user.id);
    }
  } else {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  }
};

// Helper function to decode JWT safely
const decodeJWT = (token) => {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Fix base64 URL encoding
    let base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 < Date.now();
};

const getInitialState = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  let isValidToken = false;
  
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    localStorage.removeItem('user');
  }
  
  // Validate token
  if (token) {
    try {
      const expired = isTokenExpired(token);
      if (!expired) {
        isValidToken = true;
      } else {
        console.log('Token expired, clearing localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        user = null;
      }
    } catch (e) {
      console.error('Invalid token format:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      user = null;
    }
  }
  
  // console.log('Auth initialized - Token:', isValidToken ? 'exists' : 'missing');
  // console.log('Auth initialized - User:', user?.name || 'not found');
  // console.log('Auth initialized - User role:', user?.role);
  
  return {
    user,
    token: isValidToken ? token : null,
    isAuthenticated: isValidToken && !!user,
    loading: false,
    error: null,
    initializing: false,
    tempToken: null,
    otpSent: false,
  };
};

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const { token, user } = response.data;
      
      // Save to localStorage
      saveToLocalStorage(token, user);
      
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const loginWith2FA = createAsyncThunk(
  'auth/loginWith2FA',
  async ({ email, password, tempToken, otp, method }, { rejectWithValue }) => {
    try {
      // Step 1: Verify password and get temp token
      let response;
      if (!tempToken) {
        response = await axios.post(`${API_URL}/auth/verify-password`, { email, password });
        if (!response.data.success) {
          return rejectWithValue(response.data.error || 'Invalid credentials');
        }
        tempToken = response.data.tempToken;
      }
      
      // Step 2: Verify OTP
      response = await axios.post(`${API_URL}/auth/verify-2fa`, { tempToken, otp });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Invalid OTP');
      }
      
      const { token, user } = response.data;
      saveToLocalStorage(token, user);
      
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const sendLoginOTP = createAsyncThunk(
  'auth/sendLoginOTP',
  async ({ email, password, method }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-password`, { email, password });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Invalid credentials');
      }
      
      const { tempToken, user } = response.data;
      
      await axios.post(`${API_URL}/auth/send-2fa-otp`, {
        email,
        phone: user.phone,
        method
      });
      
      return { tempToken, user };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to send OTP';
      return rejectWithValue(message);
    }
  }
);

export const resendLoginOTP = createAsyncThunk(
  'auth/resendLoginOTP',
  async ({ tempToken, method }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/resend-2fa-otp`, { tempToken, method });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to resend OTP');
      }
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      return rejectWithValue(message);
    }
  }
);

export const verifyLoginOTP = createAsyncThunk(
  'auth/verifyLoginOTP',
  async ({ tempToken, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-2fa`, { tempToken, otp });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Invalid OTP');
      }
      
      const { token, user } = response.data;
      saveToLocalStorage(token, user);
      
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'OTP verification failed';
      return rejectWithValue(message);
    }
  }
);

export const completeLoginWith2FA = createAsyncThunk(
  'auth/completeLoginWith2FA',
  async ({ email, password, method, phone }, { rejectWithValue }) => {
    try {
      const verifyResponse = await axios.post(`${API_URL}/auth/verify-password`, { 
        email, 
        password,
        phone 
      });
      
      if (!verifyResponse.data.success) {
        return rejectWithValue(verifyResponse.data.error || 'Invalid credentials');
      }
      
      const { tempToken, user } = verifyResponse.data;
      
      const otpMethod = method || (phone ? 'phone' : 'email');
      const phoneForOtp = phone || user.phone;
      
      await axios.post(`${API_URL}/auth/send-2fa-otp`, {
        tempToken,
        phone: phoneForOtp,
        method: otpMethod
      });
      
      return { tempToken, user };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to initiate login';
      return rejectWithValue(message);
    }
  }
);

export const initiateRegistration = createAsyncThunk(
  'auth/initiateRegistration',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Registration failed');
      }
      
      return {
        tempToken: response.data.tempToken,
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone || ''
      };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const verifyRegistrationOTP = createAsyncThunk(
  'auth/verifyRegistrationOTP',
  async ({ tempToken, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-registration-otp`, { tempToken, otp });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Invalid OTP');
      }
      
      const { token, user } = response.data;
      saveToLocalStorage(token, user);
      
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'OTP verification failed';
      return rejectWithValue(message);
    }
  }
);

export const resendRegistrationOTP = createAsyncThunk(
  'auth/resendRegistrationOTP',
  async ({ tempToken, method }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/resend-verification-otp`, { tempToken, method });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to resend OTP');
      }
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      return rejectWithValue(message);
    }
  }
);

export const sendRegistrationOTP = createAsyncThunk(
  'auth/sendRegistrationOTP',
  async ({ tempToken, email, phone, method }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/send-verification-otp`, {
        tempToken,
        email,
        phone,
        method
      });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to send OTP');
      }
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      return rejectWithValue(message);
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async ({ credential, isSignUp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/google`, { credential, isSignUp });
      
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Google login failed');
      }
      
      const { token, user } = response.data;
      saveToLocalStorage(token, user);
      
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to process Google login';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, user } = response.data;
      
      // Save to localStorage
      saveToLocalStorage(token, user);
      
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  // Clear localStorage
  saveToLocalStorage(null, null);
  return null;
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token found');
      }
      
      let config = {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      };
      
      let data = profileData;
      
      // Handle FormData (for file uploads)
      if (profileData instanceof FormData) {
        // Let browser set Content-Type automatically with boundary
        config.headers['Content-Type'] = 'multipart/form-data';
      } else {
        config.headers['Content-Type'] = 'application/json';
        data = JSON.stringify(profileData);
      }
      
      const response = await axios.put(`${API_URL}/users/profile/me`, data, config);
      
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        
        // Update localStorage with new user data
        const currentUser = getState().auth.user;
        const mergedUser = { ...currentUser, ...updatedUser };
        saveToLocalStorage(token, mergedUser);
        
        return mergedUser;
      } else {
        return rejectWithValue(response.data.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.error || error.response?.data?.message || 'Profile update failed';
      return rejectWithValue(message);
    }
  }
);

export const updatePrivacySettings = createAsyncThunk(
  'auth/updatePrivacy',
  async (privacyData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/users/profile/privacy`, privacyData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const currentUser = getState().auth.user;
        const updatedUser = { ...currentUser, privacy: response.data.privacy };
        saveToLocalStorage(token, updatedUser);
        return updatedUser;
      } else {
        return rejectWithValue(response.data.error || 'Failed to update privacy settings');
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update privacy settings';
      return rejectWithValue(message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'auth/updateNotifications',
  async (notificationData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/users/profile/notifications`, notificationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const currentUser = getState().auth.user;
        const updatedUser = { ...currentUser, notifications: response.data.notifications };
        saveToLocalStorage(token, updatedUser);
        return updatedUser;
      } else {
        return rejectWithValue(response.data.error || 'Failed to update notification settings');
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update notification settings';
      return rejectWithValue(message);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const currentToken = getState().auth.token;
      if (!currentToken) {
        return rejectWithValue('No token to refresh');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      
      const { token, user } = response.data;
      saveToLocalStorage(token, user);
      
      return { token, user };
    } catch (error) {
      // If refresh fails, clear everything
      saveToLocalStorage(null, null);
      const message = error.response?.data?.message || 'Token refresh failed';
      return rejectWithValue(message);
    }
  }
);

export const verifyAuth = createAsyncThunk(
  'auth/verifyAuth',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Check if token is expired first
      if (isTokenExpired(token)) {
        saveToLocalStorage(null, null);
        return rejectWithValue('Token expired');
      }
      
      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const { user } = response.data;
      
      // Update user in localStorage
      saveToLocalStorage(token, user);
      
      return { token, user };
    } catch (error) {
      // Token is invalid, clear everything
      saveToLocalStorage(null, null);
      const message = error.response?.data?.message || 'Auth verification failed';
      return rejectWithValue(message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token found');
      }
      
      const response = await axios.put(
        `${API_URL}/users/profile/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to change password';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload && state.token) {
        saveToLocalStorage(state.token, action.payload);
      }
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload && !!state.user;
      if (action.payload && state.user) {
        saveToLocalStorage(action.payload, state.user);
      } else if (action.payload) {
        saveToLocalStorage(action.payload, null);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      saveToLocalStorage(null, null);
    },
    updateUserLocally: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (state.token && state.user) {
        saveToLocalStorage(state.token, state.user);
      }
    },
    syncFromLocalStorage: (state) => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let user = null;
      
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error('Failed to sync user from localStorage:', e);
      }
      
      // Validate token expiration
      let isValidToken = !!token;
      if (token && !isTokenExpired(token)) {
        isValidToken = true;
      } else if (token) {
        isValidToken = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        user = null;
      }
      
      state.token = isValidToken ? token : null;
      state.user = isValidToken ? user : null;
      state.isAuthenticated = isValidToken && !!user;
    },
    setTempToken: (state, action) => {
      state.tempToken = action.payload;
    },
    setOtpSent: (state, action) => {
      state.otpSent = action.payload;
    },
    clearOtpState: (state) => {
      state.tempToken = null;
      state.otpSent = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Login successful, user:', action.payload.user?.name);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Login with 2FA
      .addCase(loginWith2FA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWith2FA.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWith2FA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Send Login OTP
      .addCase(sendLoginOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendLoginOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendLoginOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Resend Login OTP
      .addCase(resendLoginOTP.pending, (state) => {
        state.loading = true;
      })
      .addCase(resendLoginOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendLoginOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Verify Login OTP
      .addCase(verifyLoginOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoginOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyLoginOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Registration successful, user:', action.payload.user?.name);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Complete Login with 2FA
      .addCase(completeLoginWith2FA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeLoginWith2FA.fulfilled, (state, action) => {
        state.loading = false;
        state.tempToken = action.payload.tempToken;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(completeLoginWith2FA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Initiate Registration (OTP sent)
      .addCase(initiateRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiateRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.tempToken = action.payload.tempToken;
        state.otpSent = true;
        state.error = null;
      })
      .addCase(initiateRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Verify Registration OTP
      .addCase(verifyRegistrationOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyRegistrationOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.tempToken = null;
        state.otpSent = false;
        state.error = null;
      })
      .addCase(verifyRegistrationOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Resend Registration OTP
      .addCase(resendRegistrationOTP.pending, (state) => {
        state.loading = true;
      })
      .addCase(resendRegistrationOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendRegistrationOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send Registration OTP
      .addCase(sendRegistrationOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendRegistrationOTP.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(sendRegistrationOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        console.log('Logout successful');
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
        console.log('Profile updated successfully');
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Privacy
      .addCase(updatePrivacySettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updatePrivacySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Notifications
      .addCase(updateNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Refresh Token
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Token refreshed successfully');
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Verify Auth
      .addCase(verifyAuth.pending, (state) => {
        state.initializing = true;
      })
      .addCase(verifyAuth.fulfilled, (state, action) => {
        state.initializing = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Auth verified successfully');
      })
      .addCase(verifyAuth.rejected, (state, action) => {
        state.initializing = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        console.log('Auth verification failed:', action.payload);
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        console.log('Password changed successfully');
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectUserName = (state) => state.auth.user?.name;
export const selectUserEmail = (state) => state.auth.user?.email;
export const selectUserId = (state) => state.auth.user?._id || state.auth.user?.id;
export const selectUserAvatar = (state) => state.auth.user?.avatar;
export const selectIsInitializing = (state) => state.auth.initializing;
export const selectTempToken = (state) => state.auth.tempToken;
export const selectOtpSent = (state) => state.auth.otpSent;

// Export actions
export const { 
  setUser, 
  setToken, 
  clearError, 
  resetAuth,
  updateUserLocally,
  syncFromLocalStorage,
  setTempToken,
  setOtpSent,
  clearOtpState
} = authSlice.actions;

export default authSlice.reducer;