import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatPhoneDisplay } from '../utils/validation';
import { FiUser } from "react-icons/fi";
const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <nav className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-gradient-saffron">
              🙏 Ekadashi Counter
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-300">
                <span className='flex items-center justify-between'>
                  <span className="text-saffron-400"><FiUser /></span>
                  <span className="ml-1">{user.fullName}</span>
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">
                  {formatPhoneDisplay(user.phone)}
                </span>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Mobile user info */}
        {user && (
          <div className="sm:hidden mt-2 pt-2 border-t border-gray-700/50">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span className='flex items-center justify-between'>
                <span className="text-saffron-400"><FiUser /></span>
                <span className="ml-1">{user.fullName}</span>
              </span>
              <span className="text-gray-400">
                {formatPhoneDisplay(user.phone)}
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
