import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // ✅ Fixed path (contexts, not context)
import ChantForm from '../components/ChantForm';
import ProgressBar from '../components/ProgressBar';
import Leaderboard from '../components/Leaderboard';
import { subscribeToGlobalCount, isAdmin } from '../services/firebase'; // ✅ Removed old imports
import { useEventSettings } from '../hooks/useEventSettings'; // ✅ Add this import
import EnhancedAdminPanel from '../components/EnhancedAdminPanel';

const Home = ({ eventSettings: propEventSettings }) => { // ✅ Accept eventSettings as prop
  const { user } = useAuth();
  const [globalCount, setGlobalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  
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

  // ✅ Use dynamic goal from eventSettings
  const globalGoal = eventSettings?.globalGoal || 666;
  const progressPercentage = Math.min((globalCount / globalGoal) * 100, 100);

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
                eventSettings.eventActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {eventSettings.eventActive ? 'Active' : 'Inactive'}
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
            Your Chant Count
          </h3>
          <div className="text-4xl font-bold text-saffron-400 glow-saffron">
            {user?.chantCount || 0}
          </div>
          <p className="text-gray-400 text-sm mt-2">rounds completed</p>
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

      {/* Progress Bar */}
      <div className="card-devotional">
        <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">
          Collective Progress
        </h3>
        <ProgressBar 
          current={globalCount} 
          total={globalGoal} // ✅ Use dynamic goal
          loading={loading}
        />
        <div className="text-center mt-4">
          <span className="text-2xl font-bold text-gradient-saffron">
            {loading ? '...' : `${progressPercentage.toFixed(1)}%`}
          </span>
          <span className="text-gray-400 ml-2">completed</span>
        </div>
      </div>

      {/* Event Status Message */}
      {!eventSettings?.eventActive && (
        <div className="card-devotional text-center bg-gradient-to-r from-red-900/20 to-orange-900/10 border-red-500/30">
          <h3 className="text-xl font-bold text-red-400 mb-2">
            ⏸️ Event Paused
          </h3>
          <p className="text-gray-300">
            The event is currently paused. New submissions are not being accepted at this time.
          </p>
        </div>
      )}

      {/* Chant Submission Form - Only show if event is active */}
      {eventSettings?.eventActive && (
        <div className="card-devotional">
          <ChantForm />
        </div>
      )}

      {/* Leaderboard */}
      <div className="card-devotional">
        <Leaderboard />
      </div>

      {/* Dynamic Motivational Messages */}
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

      {progressPercentage >= 100 && (
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
