import React, { useState } from 'react';
import { validatePhoneNumber, validateFullName } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, ROLE_OPTIONS } from '../constants/roles'; // ✅ NEW: Import role constants
import { FaCircleChevronDown } from "react-icons/fa6";
const AuthForm = () => {
  const { register, login, error, loading, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    role: USER_ROLES.FOLK_BOY // ✅ NEW: Default role
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

  // ADDED: Special handler for phone input
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length > 10) {
      value = value.slice(0, 10); // Limit to 10 digits
    }
    
    // Use existing handleInputChange logic
    const syntheticEvent = {
      target: { name: 'phoneNumber', value: value }
    };
    handleInputChange(syntheticEvent);
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate phone number
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      errors.phoneNumber = phoneValidation.error;
    }
    
    // Validate full name and role (only for registration)
    if (!isLoginMode) {
      const nameValidation = validateFullName(formData.fullName);
      if (!nameValidation.isValid) {
        errors.fullName = nameValidation.error;
      }
      
      // ✅ NEW: Validate role selection
      if (!formData.role) {
        errors.role = 'Please select your role';
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
      // CHANGED: Get formatted phone with +91 from validation
      const phoneValidation = validatePhoneNumber(formData.phoneNumber);
      const formattedPhone = phoneValidation.cleanPhone;
      
      if (isLoginMode) {
        result = await login(formattedPhone); // CHANGED: Use formatted phone
      } else {
        // ✅ UPDATED: Pass role to register function
        result = await register(formData.fullName, formattedPhone, formData.role);
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
    setFormData({ 
      fullName: '', 
      phoneNumber: '', 
      role: USER_ROLES.FOLK_BOY // ✅ NEW: Reset role to default
    });
    setFormErrors({});
    clearError();
  };

  return (
    <div className="card-devotional w-full max-w-md animate-fade-in text-white overflow-hidden
      overscroll-none">
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
          <>
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

            {/* ✅ NEW: Role Selection Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Select Your Role
              </label>

              <div className="flex bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm border border-gray-700/50">
                {ROLE_OPTIONS.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, role: option.value }));
                      // Clear any role-related errors
                      if (formErrors.role) {
                        setFormErrors(prev => ({ ...prev, role: '' }));
                      }
                    }}
                    disabled={loading}
                    className={`
                      flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 ease-in-out
                      relative overflow-hidden group
                      ${formData.role === option.value
                        ? option.value === 'FOLK_BOY' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 transform scale-[1.02]'
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 transform scale-[1.02]'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {/* Animated background overlay for hover effect */}
                    <div className={`
                      absolute inset-0 opacity-0 transition-opacity duration-300
                      ${option.value === 'FOLK_BOY' 
                        ? 'bg-gradient-to-r from-green-500/10 to-green-600/10' 
                        : 'bg-gradient-to-r from-orange-500/10 to-orange-600/10'
                      }
                      ${formData.role !== option.value ? 'group-hover:opacity-100' : ''}
                    `} />
                    
                    {/* Content */}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {/* Optional: Add icons based on role */}
                      {option.value === 'FOLK_BOY'}
                      {option.value === 'DEVOTEE'}
                      {option.label}
                    </span>

                    {/* Active indicator line */}
                    {formData.role === option.value && (
                      <div className={`
                        absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-8 rounded-full
                        animate-pulse
                        ${option.value === 'FOLK_BOY' ? 'bg-green-300' : 'bg-orange-300'}
                      `} />
                    )}
                  </button>
                ))}
              </div>

              {/* Error message */}
              {formErrors.role && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm animate-fadeIn">
                  <span className="flex-shrink-0">⚠️</span>
                  <p>{formErrors.role}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* CHANGED: Phone input with visual +91 prefix */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10">
              +91
            </span>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              className={`input-devotional pl-12 ${formErrors.phoneNumber ? 'border-red-500' : ''}`}
              placeholder="Enter 10-digit number"
              disabled={loading}
              maxLength={10}
            />
          </div>
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
