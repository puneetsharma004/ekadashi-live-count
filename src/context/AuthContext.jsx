// Handles auth state, user session
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserByPhone, checkPhoneExists, createUser, isAdmin, authenticateAdmin } from '../services/firebase.js';

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
  // Add these properties to your AuthContext
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('ekadashi-user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('ekadashi-user');
      }
    }
    setLoading(false);
  }, []);

  const register = async (fullName, phoneNumber, role) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!fullName.trim() || !phoneNumber.trim()) {
        throw new Error('Please fill in all fields');
      }
      
      // Clean phone number (remove spaces, special chars)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      // Check if phone already exists
      const phoneExists = await checkPhoneExists(cleanPhone);
      if (phoneExists) {
        throw new Error('Phone number already registered');
      }
      // Check if admin
      const adminCheck = isAdmin(cleanPhone);

      if (adminCheck) {
      const adminPassword = prompt('Enter admin password:');
      if (!authenticateAdmin(cleanPhone, adminPassword)) {
        throw new Error('Invalid admin credentials');
      }
    }

      // Create new user
      const result = await createUser({
        fullName: fullName.trim(),
        phone: cleanPhone,
        role: role // ✅ Add role to the user data
      });

      if (result.success) {
        const newUser = {
          id: result.id,
          fullName: fullName.trim(),
          phone: cleanPhone,
          chantCount: 0,
          role: role, // ✅ Add role to the user object
          isAdmin: adminCheck  // Add admin flag
        };
        
        // Save to localStorage and state
        localStorage.setItem('ekadashi-user', JSON.stringify(newUser));
        setUser(newUser);
        setIsAdminUser(adminCheck);
        
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (phoneNumber) => {
    setLoading(true);
    setError(null);
    
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      const result = await getUserByPhone(cleanPhone);
      if (result.success) {
        // Save to localStorage and state
        localStorage.setItem('ekadashi-user', JSON.stringify(result.user));
        setUser(result.user);
        return { success: true };
      } else {
        throw new Error('Phone number not found. Please register first.');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ekadashi-user');
    setUser(null);
    setError(null);
  };

  const updateUserChantCount = (newCount) => {
    if (user) {
      const updatedUser = { ...user, chantCount: newCount };
      setUser(updatedUser);
      localStorage.setItem('ekadashi-user', JSON.stringify(updatedUser));
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUserChantCount,
    clearError,
    isAuthenticated: !!user,
    isAdminUser  // Add this
  };

  

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
