import React, { useState } from 'react';
import { validatePhoneNumber, validateFullName } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

const AuthForm = () => {
  const { register, login, error, loading, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate phone number
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      errors.phoneNumber = phoneValidation.error;
    }
    
    // Validate full name (only for registration)
    if (!isLoginMode) {
      const nameValidation = validateFullName(formData.fullName);
      if (!nameValidation.isValid) {
        errors.fullName = nameValidation.error;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      let result;
      if (isLoginMode) {
        result = await login(formData.phoneNumber);
      } else {
        result = await register(formData.fullName, formData.phoneNumber);
      }
      
      if (result.success) {
        // Success handled by AuthContext (user state updated)
        console.log('Authentication successful');
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({ fullName: '', phoneNumber: '' });
    setFormErrors({});
    clearError();
  };

  return (
    <div className="card-devotional w-full max-w-md animate-fade-in text-white">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gradient-saffron mb-2">
          🙏 Hare Krishna
        </h1>
        <p className="text-gray-300">
          {isLoginMode ? 'Welcome back!' : 'Join the Ekadashi Chanting Event'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLoginMode && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`input-devotional ${formErrors.fullName ? 'border-red-500' : ''}`}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {formErrors.fullName && (
              <p className="text-red-400 text-sm mt-1">{formErrors.fullName}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className={`input-devotional ${formErrors.phoneNumber ? 'border-red-500' : ''}`}
            placeholder="Enter your phone number"
            disabled={loading}
          />
          {formErrors.phoneNumber && (
            <p className="text-red-400 text-sm mt-1">{formErrors.phoneNumber}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-saffron disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="spinner mr-2"></div>
              {isLoginMode ? 'Signing In...' : 'Registering...'}
            </span>
          ) : (
            isLoginMode ? 'Sign In' : 'Register & Join'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="text-saffron-400 hover:text-saffron-300 text-sm transition-colors"
          disabled={loading}
        >
          {isLoginMode 
            ? "Don't have an account? Register here" 
            : 'Already registered? Sign in here'
          }
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
