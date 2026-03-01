import api from './api';

export const authService = {
  // Request OTP
  requestOTP: async (mobileNumber) => {
    const response = await api.post('/auth/request-otp', { mobileNumber });
    return response.data;
  },

  // Verify OTP and login
  verifyOTP: async (mobileNumber, otp) => {
    const response = await api.post('/auth/verify-otp', { mobileNumber, otp });
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};