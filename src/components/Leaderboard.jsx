import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // ✅ Fixed path
import { subscribeToLeaderboard } from '../services/firebase.js';

const Leaderboard = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time leaderboard updates
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

  const getFirstName = (fullName) => {
    return fullName.split(' ')[0];
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
    <div className="w-full overflow-hidden"> {/* ✅ Prevent horizontal overflow */}
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
          {/* ✅ IMPROVED: Better responsive container with no horizontal scroll */}
          <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {participants.map((participant, index) => {
              const rank = index + 1;
              const isCurrentUser = participant.id === user?.id;
              const isTopThree = rank <= 3;
              
              return (
                <div
                  key={participant.id}
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 min-w-0 ${
                    isCurrentUser 
                      ? 'bg-saffron-900/30 border border-saffron-500/50 glow-saffron' 
                      : isTopThree 
                        ? 'bg-gray-800/80 border border-gray-600/50'
                        : 'bg-gray-800/50'
                  } ${isCurrentUser ? 'transform scale-[1.02]' : ''}`}
                >
                  {/* ✅ Rank - Fixed width to prevent layout shifts */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 text-sm font-bold flex-shrink-0 ${
                    isTopThree ? 'bg-gradient-to-r from-devotional-gold to-saffron-400 text-white' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {getRankEmoji(rank)}
                  </div>

                  {/* ✅ User info - Flexible with proper truncation */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${
                      isCurrentUser ? 'text-saffron-300' : 'text-white'
                    }`}>
                      <span className="mr-1">{getFirstName(participant.fullName)}</span>
                      {isCurrentUser && (
                        <span className="inline-block text-xs bg-saffron-500 text-white px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    
                    {/* ✅ IMPROVED: Better responsive last active display */}
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
                        {rank === 1 && <span className="text-yellow-400">👑</span>}
                        {rank === 2 && <span className="text-gray-300">⭐</span>}
                        {rank === 3 && <span className="text-orange-400">🌟</span>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ IMPROVED: Better responsive summary stats */}
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
