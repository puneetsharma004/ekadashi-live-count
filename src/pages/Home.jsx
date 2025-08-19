import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // ✅ Fixed path (contexts, not context)
import ChantForm from '../components/ChantForm';
import ProgressBar from '../components/ProgressBar';
import Leaderboard from '../components/Leaderboard';
import { subscribeToGlobalCount, isAdmin, subscribeToUserChantCount } from '../services/firebase.js'; // ✅ Add new function
import { useEventSettings } from '../hooks/useEventSettings'; // ✅ Add this import
import EnhancedAdminPanel from '../components/EnhancedAdminPanel';

const Home = ({ eventSettings: propEventSettings }) => { // ✅ Accept eventSettings as prop
  const { user } = useAuth(); // ✅ Add updateUser
  const [globalCount, setGlobalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [userChantCount, setUserChantCount] = useState(user?.chantCount || 0); // ✅ Add local state
  
  // ✅ Use hook for event settings if not provided as prop
  const { settings: hookEventSettings, loading: settingsLoading } = useEventSettings();
  const eventSettings = propEventSettings || hookEventSettings;

  // Check if current user is admin
  const userIsAdmin = user && isAdmin(user.phone);

  useEffect(() => {
    // Subscribe to real-time global count updates
    const unsubscribe = subscribeToGlobalCount((totalCount) => {
      setGlobalCount(totalCount);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ NEW: Subscribe to real-time user chant count updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeUser = subscribeToUserChantCount(user.id, (chantCount) => {
      console.log('🔄 User chant count updated:', chantCount);
      setUserChantCount(chantCount);
      // Also update the AuthContext to keep it in sync
      // updateUser({ ...user, chantCount: chantCount });
    });

    return () => unsubscribeUser();
  }, [user?.id]);

  // ✅ Use dynamic goal from eventSettings
  const globalGoal = eventSettings?.globalGoal || 666;
  
  // ✅ UPDATED: Allow progress over 100%
  const progressPercentage = (globalCount / globalGoal) * 100;
  const isOverAchieved = progressPercentage > 100;

  // Show loading if settings are still loading
  if (settingsLoading && !propEventSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 text-saffron-500"></div>
          <p className="text-gray-300">Loading event settings...</p>
        </div>
      </div>
    );
  }

  // If admin and admin panel is active, show admin panel
  if (userIsAdmin && showAdmin) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <button
            onClick={() => setShowAdmin(false)}
            className="btn-secondary mb-4"
          >
            ← Back to User View
          </button>
        </div>
        <EnhancedAdminPanel eventSettings={eventSettings} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient-saffron mb-2">
          Hare Krishna, {user?.fullName} 🙏
        </h1>
        <p className="text-gray-300 text-lg">
          Welcome to the Ekadashi Chanting Event
        </p>
        
        {/* Admin Switch Button */}
        {userIsAdmin && (
          <div className="mt-4">
            <button
              onClick={() => setShowAdmin(true)}
              className="btn-saffron text-sm"
            >
              🔧 Enhanced Admin Panel
            </button>
          </div>
        )}
      </div>

      {/* Event Info Banner */}
      {eventSettings && (
        <div className="card-devotional bg-gradient-to-r from-saffron-900/10 to-devotional-gold/5 border-saffron-500/20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gradient-saffron mb-2">
              {eventSettings.eventName || 'Current Event'}
            </h2>
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-300">
              <span>Target: <strong className="text-saffron-400">{globalGoal}</strong> rounds</span>
              <span>•</span>
              <span>Time: <strong className="text-saffron-400">{eventSettings.startTime}:00 - {eventSettings.endTime}:00</strong></span>
              <span>•</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                eventSettings.eventActive 
                  ? 'bg-green-500 text-white' 
                  : eventSettings.status === 'completed' 
                    ? 'bg-blue-500 text-white' 
                    : eventSettings.status === 'created'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-red-500 text-white'
              }`}>
                {eventSettings.eventActive 
                  ? 'Active' 
                  : eventSettings.status === 'completed' 
                    ? 'Completed' 
                    : eventSettings.status === 'created'
                      ? 'Starting Soon'
                      : 'Paused'
                }
              </span>
            </div>
            {eventSettings.description && (
              <p className="text-gray-400 text-sm mt-2">{eventSettings.description}</p>
            )}
          </div>
        </div>
      )}

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-devotional text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Your Chanted Rounds
          </h3>
          {/* ✅ FIXED: Use real-time userChantCount instead of static user.chantCount */}
          <div className="text-4xl font-bold text-saffron-400 glow-saffron">
            {userChantCount}
          </div>
          <p className="text-gray-400 text-sm mt-2">rounds completed</p>
          
          {/* ✅ NEW: Show update indicator when count changes */}
          {userChantCount !== (user?.chantCount || 0) && (
            <p className="text-green-400 text-xs mt-1 animate-pulse">
              ✅ Updated in real-time
            </p>)}
        </div>

        <div className="card-devotional text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Global Progress
          </h3>
          <div className="text-4xl font-bold text-devotional-gold glow-saffron">
            {loading ? (
              <div className="spinner mx-auto"></div>
            ) : (
              `${globalCount}`
            )}
          </div>
          <p className="text-gray-400 text-sm mt-2">
            out of {globalGoal} rounds
          </p>
        </div>
      </div>

      {/* ✅ UPDATED: Enhanced Progress Bar with Over 100% Support */}
      <div className="card-devotional">
        <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">
          Collective Progress
        </h3>
        <ProgressBar 
          current={globalCount} 
          total={globalGoal} // ✅ Use dynamic goal
          loading={loading}
          allowOver100={true} // ✅ Allow over 100%
        />
        <div className="text-center mt-4">
          <span className={`text-2xl font-bold ${
            isOverAchieved 
              ? 'text-gradient-to-r from-devotional-gold to-yellow-400 bg-clip-text text-transparent glow-saffron' 
              : 'text-gradient-saffron'
          }`}>
            {loading ? '...' : `${progressPercentage.toFixed(1)}%`}
          </span>
          <span className="text-gray-400 ml-2">
            {isOverAchieved ? 'over-achieved!' : 'completed'}
          </span>
          
          {/* ✅ Show over-achievement badge */}
          {isOverAchieved && (
            <div className="mt-2">
              <span className="bg-gradient-to-r from-devotional-gold to-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                🌟 Target Exceeded! 🌟
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ FIXED: Only show paused/completed messages for events that are NOT newly created */}
      {!eventSettings?.eventActive && eventSettings?.status !== 'created' && (
        <div className="card-devotional text-center">
          {eventSettings?.status === 'completed' ? (
            // ✅ COMPLETED EVENT MESSAGE
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/10 border-blue-500/30 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">
                🎊 Event Completed Successfully!
              </h3>
              <p className="text-gray-300 text-lg mb-4">
                Congratulations! This Ekadashi chanting event has been successfully completed.
              </p>
              
              {/* Show final stats if available */}
              {eventSettings?.finalStats && (
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total Rounds:</span>
                      <div className="text-saffron-400 font-bold text-lg">
                        {eventSettings.finalStats.totalRounds}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Participants:</span>
                      <div className="text-blue-400 font-bold text-lg">
                        {eventSettings.finalStats.totalParticipants}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Active Chanters:</span>
                      <div className="text-green-400 font-bold text-lg">
                        {eventSettings.finalStats.activeParticipants}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-saffron-400 font-semibold">
                  🙏 Thank you for your devotional participation!
                </p>
                <p className="text-gray-400">
                  ✨ Wait for the next Ekadashi event to show your spiritual strength again!
                </p>
                <p className="text-gray-500 text-sm mt-4">
                  Your account remains active for future events 📿
                </p>
              </div>
            </div>
          ) : eventSettings?.status === 'paused' ? (
            // ✅ ONLY show paused message for events with status 'paused'
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/10 border-red-500/30 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-red-400 mb-2">
                ⏸️ Event Temporarily Paused
              </h3>
              <p className="text-gray-300">
                The running event has been temporarily paused by the admin. New chant submissions are not being accepted.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Please wait for the admin to resume the event.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* ✅ UPDATED: Only show chant form if event is actually active */}
      {eventSettings?.eventActive === true && eventSettings?.status === 'active' && (
        <div className="card-devotional">
          <ChantForm />
        </div>
      )}

      {/* Leaderboard */}
      <div className="card-devotional">
        <Leaderboard />
      </div>

      {/* ✅ UPDATED: Enhanced Motivational Messages with Over-Achievement */}
      {progressPercentage >= 50 && progressPercentage < 100 && (
        <div className="card-devotional text-center bg-gradient-to-r from-saffron-900/20 to-devotional-gold/10 border-saffron-500/30">
          <h3 className="text-xl font-bold text-gradient-saffron mb-2">
            🌟 Great Progress!
          </h3>
          <p className="text-gray-300">
            We're more than halfway to our goal! Keep chanting! 🎉
          </p>
        </div>
      )}

      {progressPercentage >= 100 && progressPercentage < 110 && (
        <div className="card-devotional text-center bg-gradient-to-r from-devotional-gold/20 to-saffron-500/20 border-devotional-gold/50">
          <h3 className="text-2xl font-bold text-gradient-saffron mb-2">
            🎊 Goal Achieved!
          </h3>
          <p className="text-gray-300 text-lg">
            Congratulations! We've reached our collective goal of {globalGoal} rounds!
          </p>
          <p className="text-saffron-300 mt-2">
            Hare Krishna! 🙏✨
          </p>
        </div>
      )}

      {/* ✅ NEW: Over-Achievement Messages */}
      {progressPercentage >= 110 && progressPercentage < 150 && (
        <div className="card-devotional text-center bg-gradient-to-r from-yellow-900/20 to-devotional-gold/20 border-yellow-500/50">
          <h3 className="text-2xl font-bold text-gradient-to-r from-devotional-gold to-yellow-400 bg-clip-text text-transparent mb-2">
            🌟 Outstanding Achievement! 🌟
          </h3>
          <p className="text-gray-300 text-lg">
            Amazing! You've exceeded the goal by {(progressPercentage - 100).toFixed(1)}%!
          </p>
          <p className="text-devotional-gold mt-2 font-semibold">
            This is the power of collective devotion! 🔥
          </p>
        </div>
      )}

      {progressPercentage >= 150 && (
        <div className="card-devotional text-center bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/50 animate-pulse-slow">
          <h3 className="text-3xl font-bold text-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            🚀 Legendary Achievement! 🚀
          </h3>
          <p className="text-gray-300 text-xl">
            INCREDIBLE! You've smashed the goal by {(progressPercentage - 100).toFixed(1)}%!
          </p>
          <p className="text-purple-300 mt-2 font-bold text-lg">
            This level of devotion is truly inspiring! 🎆
          </p>
        </div>
      )}

      {/* No Event Message */}
      {!eventSettings && (
        <div className="card-devotional text-center">
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            No Active Event
          </h3>
          <p className="text-gray-400">
            There is currently no active chanting event. Please wait for an admin to create a new event.
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
