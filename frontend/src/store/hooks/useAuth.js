import { useSelector, useDispatch } from 'react-redux';
import { loginUser, registerUser, logoutUser, updateProfile, clearError } from '../slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login: (credentials) => dispatch(loginUser(credentials)),
    register: (userData) => dispatch(registerUser(userData)),
    logout: () => dispatch(logoutUser()),
    updateProfile: (data) => dispatch(updateProfile(data)),
    clearError: () => dispatch(clearError()),
  };
};

export default useAuth;
