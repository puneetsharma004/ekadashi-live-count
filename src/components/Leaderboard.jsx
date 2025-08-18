import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
      <div>
        <h3 className="text-xl font-semibold text-gray-300 mb-4 text-center">
          📊 Live Leaderboard
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3 bg-gray-800/50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-700 rounded-full mr-3"></div>
              <div className="flex-1 h-4 bg-gray-700 rounded mr-3"></div>
              <div className="w-16 h-4 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-300">
          📊 Live Leaderboard
        </h3>
        <div className="text-sm text-gray-400">
          {activeParticipants}/{totalParticipants} active
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No participants yet. Be the first to start chanting! 🙏</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {participants.map((participant, index) => {
            const rank = index + 1;
            const isCurrentUser = participant.id === user?.id;
            const isTopThree = rank <= 3;
            
            return (
              <div
                key={participant.id}
                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isCurrentUser 
                    ? 'bg-saffron-900/30 border border-saffron-500/50 glow-saffron' 
                    : isTopThree 
                      ? 'bg-gray-800/80 border border-gray-600/50'
                      : 'bg-gray-800/50'
                } ${isCurrentUser ? 'transform scale-[1.02]' : ''}`}
              >
                {/* Rank */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 text-sm font-bold ${
                  isTopThree ? 'bg-gradient-to-r from-devotional-gold to-saffron-400 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  {getRankEmoji(rank)}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${
                    isCurrentUser ? 'text-saffron-300' : 'text-white'
                  }`}>
                    {getFirstName(participant.fullName)}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-saffron-500 text-white px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  {participant.lastUpdated && (
                    <div className="text-xs text-gray-400">
                      Last active: {new Date(participant.lastUpdated.toDate()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>

                {/* Chant count */}
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    isCurrentUser ? 'text-saffron-400' : isTopThree ? 'text-devotional-gold' : 'text-gray-300'
                  }`}>
                    {participant.chantCount}
                  </div>
                  <div className="text-xs text-gray-400">
                    rounds
                  </div>
                </div>

                {/* Trophy for top performers */}
                {isTopThree && participant.chantCount > 0 && (
                  <div className="ml-2">
                    {rank === 1 && <span className="text-yellow-400">👑</span>}
                    {rank === 2 && <span className="text-gray-300">⭐</span>}
                    {rank === 3 && <span className="text-orange-400">🌟</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      {participants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="grid grid-cols-2 gap-4 text-center text-sm">
            <div>
              <div className="text-gray-400">Total Participants</div>
              <div className="text-lg font-bold text-white">{totalParticipants}</div>
            </div>
            <div>
              <div className="text-gray-400">Active Chanters</div>
              <div className="text-lg font-bold text-saffron-400">{activeParticipants}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
