import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMobileAlt, FaLock, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Enter mobile, 2: Enter OTP
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { requestOTP, login } = useAuth();
  
  const from = location.state?.from || '/';

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await requestOTP(mobileNumber);
      
      if (response.success) {
        setStep(2);
        setCountdown(60); // 60 seconds countdown
      } else {
        setError(response.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await login(mobileNumber, otp);
      
      if (response.success) {
        // Redirect to where user came from or home
        navigate(from, { replace: true });
      } else {
        setError(response.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await requestOTP(mobileNumber);
      
      if (response.success) {
        setCountdown(60);
      } else {
        setError(response.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            {step === 1 ? <FaMobileAlt /> : <FaLock />}
          </div>
          <h2 className="login-title">
            {step === 1 ? 'Enter Mobile Number' : 'Verify OTP'}
          </h2>
          <p className="login-subtitle">
            {step === 1 
              ? 'We\'ll send a verification code to your mobile number'
              : `Enter the 6-digit code sent to ${mobileNumber}`
            }
          </p>
        </div>

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleMobileSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div className="input-group">
                <span className="input-prefix">+91</span>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                      setMobileNumber(value);
                      setError('');
                    }
                  }}
                  placeholder="Enter 10-digit number"
                  className="form-input"
                  maxLength={10}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || mobileNumber.length !== 10}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <FaArrowRight className="arrow-icon" />
                </>
              )}
            </button>

            <p className="terms-text">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) {
                    setOtp(value);
                    setError('');
                  }
                }}
                placeholder="Enter 6-digit OTP"
                className="form-input otp-input"
                maxLength={6}
                required
                disabled={loading}
              />
              
              <div className="otp-actions">
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
                
                <button
                  type="button"
                  className="change-number-btn"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  Change Number
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Login
                  <FaArrowRight className="arrow-icon" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="guest-option">
          <p className="guest-text">
            Don't want to login? 
            <button 
              className="guest-btn"
              onClick={() => navigate('/')}
            >
              Continue as guest
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;