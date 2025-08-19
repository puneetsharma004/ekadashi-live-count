import React from 'react';
import { IoHome, IoBookmarks, IoTrophy } from 'react-icons/io5';

const MobileBottomNav = ({ activeSection, setActiveSection }) => {
  const navItems = [
    {
      id: 'event',
      label: 'Event',
      icon: IoHome,
      activeColor: 'text-saffron-400',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'japa',
      label: 'Japa',
      icon: IoBookmarks,
      activeColor: 'text-devotional-gold',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: IoTrophy,
      activeColor: 'text-saffron-400',
      inactiveColor: 'text-gray-500'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50 md:hidden z-50">
      <div className="flex"> {/* ✅ Changed from justify-around to flex */}
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-all duration-200 ${
                isActive 
                  ? 'bg-gray-800/50' 
                  : 'hover:bg-gray-800/30'
              }`} /* ✅ Added flex-1 for equal width and justify-center */
            >
              <IconComponent 
                className={`text-2xl mb-1 transition-colors ${
                  isActive ? item.activeColor : item.inactiveColor
                }`} 
              />
              <span className={`text-xs font-medium transition-colors ${
                isActive ? item.activeColor : item.inactiveColor
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
