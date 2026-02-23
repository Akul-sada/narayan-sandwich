import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (mobileNumber, otp) => {
    try {
      setError(null);
      const response = await authService.verifyOTP(mobileNumber, otp);
      
      if (response.success) {
        const { token, user: userData, cart } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, user: userData, cart };
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return { success: false, error: err.response?.data?.message };
    }
  };

  const requestOTP = async (mobileNumber) => {
    try {
      setError(null);
      const response = await authService.requestOTP(mobileNumber);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      return { success: false, error: err.response?.data?.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = '/';
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      return { success: false, error: err.response?.data?.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    requestOTP,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};