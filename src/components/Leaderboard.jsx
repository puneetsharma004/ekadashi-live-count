import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToLeaderboard } from '../services/firebase.js';
import { FaStar, FaCrown } from "react-icons/fa";

const Leaderboard = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((users) => {
      setParticipants(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  // ✅ NEW: Role-based name formatting function
  const formatDisplayName = (fullName, role, isMobile = false) => {
    if (!fullName) return '';
    
    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    
    // Check if user is a devotee
    const isDevotee = role?.toLowerCase() === 'devotee';
    
    if (isDevotee) {
      // For devotees: "Mayapur Prabhu (Devotee)" on desktop, "Mayapur Prabhu" on mobile
      const firstName = capitalize(nameParts[0]);
      const devoteeTitle = `${firstName} Prabhu`;
      
      return isMobile ? devoteeTitle : `${devoteeTitle} (Devotee)`;
    } else {
      // For folk boys: existing format "Puneet S."
      if (nameParts.length === 1) {
        return capitalize(nameParts[0]);
      } else {
        const firstName = capitalize(nameParts[0]);
        const surnameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        return `${firstName} ${surnameInitial}.`;
      }
    }
  };

  // ✅ NEW: Get role-based styling
  const getRoleBasedStyling = (role, isCurrentUser) => {
    const isDevotee = role?.toLowerCase() === 'devotee';
    
    if (isCurrentUser) {
      return 'text-saffron-300';
    } else if (isDevotee) {
      return 'text-orange-200'; // Slightly different color for devotees
    } else {
      return 'text-white';
    }
  };

  const totalParticipants = participants.length;
  const activeParticipants = participants.filter(p => p.chantCount > 0).length;

  if (loading) {
    return (
      <div className="w-full">
        <h3 className="text-xl font-semibold text-gray-300 mb-4 text-center">
          📊 Live Leaderboard
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3 bg-gray-800/50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-700 rounded-full mr-3 flex-shrink-0"></div>
              <div className="flex-1 h-4 bg-gray-700 rounded mr-3"></div>
              <div className="w-16 h-4 bg-gray-700 rounded flex-shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-xl font-semibold text-gray-300">
          📊 Live Leaderboard
        </h3>
        <div className="text-sm text-gray-400 flex-shrink-0">
          {activeParticipants}/{totalParticipants} active
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No participants yet. Be the first to start chanting! 🙏</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {participants.map((participant, index) => {
              const rank = index + 1;
              const isCurrentUser = participant.id === user?.id;
              const isTopThree = rank <= 3;
              const isDevotee = participant.role?.toLowerCase() === 'devotee';
              
              return (
                <div
                  key={participant.id}
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 min-w-0 ${
                    isCurrentUser 
                      ? 'bg-saffron-900/30 border border-saffron-500/50 glow-saffron' 
                      : isTopThree 
                        ? 'bg-gray-800/80 border border-gray-600/50'
                        : 'bg-gray-800/50'
                  } ${isCurrentUser ? 'transform scale-[1.02]' : ''} ${
                    isDevotee ? 'border-l-2 border-l-orange-400/50' : ''
                  }`}
                >
                  {/* ✅ Rank - Fixed width to prevent layout shifts */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 text-sm font-bold flex-shrink-0 ${
                    isTopThree ? 'bg-gradient-to-r from-devotional-gold to-saffron-400 text-white' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {getRankEmoji(rank)}
                  </div>

                  {/* ✅ User info - Flexible with proper truncation */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${getRoleBasedStyling(participant.role, isCurrentUser)}`}>
                      {/* ✅ UPDATED: Desktop display */}
                      <span className="mr-1 hidden sm:inline">
                        {formatDisplayName(participant.fullName, participant.role, false)}
                      </span>
                      {/* ✅ NEW: Mobile display */}
                      <span className="mr-1 sm:hidden">
                        {formatDisplayName(participant.fullName, participant.role, true)}
                      </span>
                      
                      {isCurrentUser && (
                        <span className="inline-block text-xs bg-saffron-500 text-white px-2 py-0.5 rounded-full ml-1">
                          You
                        </span>
                      )}
                    </div>
                    
                    {participant.lastUpdated && (
                      <div className="text-xs text-gray-400 truncate">
                        <span className="hidden sm:inline">Last active: </span>
                        <span className="sm:hidden">Active: </span>
                        {new Date(participant.lastUpdated.toDate()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>

                  {/* ✅ Chant count - Fixed width, responsive text size */}
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-lg sm:text-xl font-bold ${
                      isCurrentUser ? 'text-saffron-400' : isTopThree ? 'text-devotional-gold' : 'text-gray-300'
                    }`}>
                      {participant.chantCount}
                    </div>
                    <div className="text-xs text-gray-400">
                      rounds
                    </div>
                  </div>

                  {/* ✅ Trophy - Fixed width */}
                  <div className="ml-2 w-6 flex justify-center flex-shrink-0">
                    {isTopThree && participant.chantCount > 0 && (
                      <>

                        {rank === 1 && <FaCrown className="text-yellow-400" />}
                        {rank === 2 && <FaStar className="text-gray-300" />}
                        {rank === 3 && <FaStar className="text-orange-400" />}

                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div className="min-w-0">
                <div className="text-gray-400 text-xs sm:text-sm">Total Participants</div>
                <div className="text-lg font-bold text-white">{totalParticipants}</div>
              </div>
              <div className="min-w-0">
                <div className="text-gray-400 text-xs sm:text-sm">Active Chanters</div>
                <div className="text-lg font-bold text-saffron-400">{activeParticipants}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
