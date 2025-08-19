import React from 'react';
import ProgressBar from '../ProgressBar';

const EventSection = ({ 
  user, 
  eventSettings, 
  globalCount, 
  globalGoal, 
  loading, 
  progressPercentage, 
  isOverAchieved, 
  userIsAdmin, 
  setShowAdmin 
}) => {
  return (
    <div className="space-y-6">
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
            <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-300">
              <span>Target: <strong className="text-saffron-400">{globalGoal}</strong> rounds</span>
              <span className="hidden sm:inline">•</span>
              <span>Time: <strong className="text-saffron-400">{eventSettings.startTime}:00 - {eventSettings.endTime}:00</strong></span>
              <span className="hidden sm:inline">•</span>
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

      {/* Global Progress */}
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

      {/* Progress Bar */}
      <div className="card-devotional">
        <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">
          Collective Progress
        </h3>
        <ProgressBar 
          current={globalCount} 
          total={globalGoal}
          loading={loading}
          allowOver100={true}
        />
        <div className="text-center mt-4">
          <span className={`text-2xl font-bold ${
            isOverAchieved 
              ? 'text-gradient-saffron glow-saffron' 
              : 'text-gradient-saffron'
          }`}>
            {loading ? '...' : `${progressPercentage.toFixed(1)}%`}
          </span>
          <span className="text-gray-400 ml-2">
            {isOverAchieved ? 'over-achieved!' : 'completed'}
          </span>
          
          {/* Show over-achievement badge */}
          {isOverAchieved && (
            <div className="mt-2">
              <span className="bg-gradient-to-r from-devotional-gold to-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                🌟 Target Exceeded! 🌟
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Event Status Messages */}
      {!eventSettings?.eventActive && eventSettings?.status !== 'created' && (
        <div className="card-devotional text-center">
          {eventSettings?.status === 'completed' ? (
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/10 border-blue-500/30 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">
                🎊 Event Completed Successfully!
              </h3>
              <p className="text-gray-300 text-lg mb-4">
                Congratulations! This Ekadashi chanting event has been successfully completed.
              </p>
              
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
              </div>
            </div>
          ) : eventSettings?.status === 'paused' ? (
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/10 border-red-500/30 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-red-400 mb-2">
                ⏸️ Event Temporarily Paused
              </h3>
              <p className="text-gray-300">
                The running event has been temporarily paused by the admin.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Motivational Messages */}
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

      {progressPercentage >= 110 && progressPercentage < 150 && (
        <div className="card-devotional text-center bg-gradient-to-r from-yellow-900/20 to-devotional-gold/20 border-yellow-500/50">
          <h3 className="text-2xl font-bold text-gradient-saffron mb-2">
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
          <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
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

export default EventSection;
