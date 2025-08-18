import React, { useState, useEffect } from 'react';
import { getTimeUntilStart } from '../services/firebase.js';

const CountdownTimer = ({ eventSettings, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isEventStarted, setIsEventStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateTimer = () => {
      const millisUntilStart = getTimeUntilStart(eventSettings);
      
      if (millisUntilStart <= 0) {
        setIsEventStarted(true);
        setTimeLeft(0);
        // Call onComplete callback when countdown finishes
        if (onComplete) {
          onComplete();
        }
      } else {
        setTimeLeft(millisUntilStart);
      }
      setIsLoading(false);
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [eventSettings, onComplete]);

  // Show event started message
  if (isEventStarted) {
    return (
      <div className="text-center">
        <div className="bg-gradient-to-r from-green-500 to-saffron-500 rounded-lg p-6 glow-saffron animate-pulse">
          <h3 className="text-2xl font-bold text-white mb-2">
            🎉 Event Started!
          </h3>
          <p className="text-white/90 mb-4">
            The Ekadashi Chanting Event is now live!
          </p>
          <div className="spinner mx-auto"></div>
          <p className="text-white/80 text-sm mt-2">
            Switching to main app...
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="spinner mx-auto mb-4 text-saffron-500"></div>
        <p className="text-gray-300">Loading countdown...</p>
      </div>
    );
  }

  // ✅ FIXED: Enhanced formatTimeLeft function
  const formatTimeLeft = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      totalHours: Math.floor(totalSeconds / 3600), // Total hours for display
      totalMinutes: Math.floor(totalSeconds / 60), // ✅ Added: Total minutes
      totalSeconds: totalSeconds // ✅ Added: Total seconds
    };
  };

  const time = formatTimeLeft(timeLeft);
  
// ✅ FIXED: Better countdown message logic with proper rounding
const getCountdownMessage = () => {
  const totalSeconds = Math.floor(timeLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (totalSeconds >= 24 * 3600) {
    // More than 24 hours - show days and hours
    return `${time.days} day${time.days !== 1 ? 's' : ''} and ${time.hours} hour${time.hours !== 1 ? 's' : ''}`;
  } else if (totalSeconds >= 3600) {
    // More than 1 hour - use smart rounding
    if (minutes > 45) {
      // 2h 57m → "Less than 3 hours"
      return `Less than ${hours + 1} hour${hours + 1 !== 1 ? 's' : ''}`;
    } else if (minutes > 15) {
      // 2h 30m → "About 2.5 hours" 
      return `About ${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      // 2h 5m → "About 2 hours"
      return `About ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  } else if (totalSeconds >= 60) {
    // Less than 1 hour - show exact minutes
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    // Less than 1 minute - show seconds
    return `${Math.floor(totalSeconds)} second${Math.floor(totalSeconds) !== 1 ? 's' : ''}`;
  }
};


  return (
    <div className="text-center space-y-6">
      {/* ✅ Main Event Title */}
      <div className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient-saffron">
          🕉️ Ekadashi Chanting Event
        </h2>
        <h3 className="text-lg md:text-xl font-semibold text-white">
          {eventSettings?.eventName || 'Sacred Chanting Marathon'}
        </h3>
        <div className="bg-saffron-900/20 border border-saffron-500/30 rounded-lg p-3">
          <p className="text-saffron-300 font-medium">
            Event starting in {getCountdownMessage()}
          </p>
        </div>
      </div>

      {/* ✅ Countdown Display */}
      <div className="space-y-4">
        {/* Big countdown numbers */}
        <div className="flex justify-center items-center flex-wrap gap-3">
          {/* Days (only show if > 0) */}
          {time.days > 0 && (
            <>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 md:p-6 shadow-lg border border-gray-700 min-w-[80px] md:min-w-[100px]">
                <div className="text-2xl md:text-4xl font-bold text-saffron-400 glow-saffron">
                  {time.days.toString().padStart(2, '0')}
                </div>
                <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-1">
                  {time.days === 1 ? 'Day' : 'Days'}
                </div>
              </div>
              <div className="text-saffron-400 text-2xl md:text-3xl font-bold">:</div>
            </>
          )}

          {/* Hours */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 md:p-6 shadow-lg border border-gray-700 min-w-[80px] md:min-w-[100px]">
            <div className="text-2xl md:text-4xl font-bold text-saffron-400 glow-saffron">
              {time.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-1">
              {time.hours === 1 ? 'Hour' : 'Hours'}
            </div>
          </div>

          <div className="text-saffron-400 text-2xl md:text-3xl font-bold animate-pulse">:</div>

          {/* Minutes */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 md:p-6 shadow-lg border border-gray-700 min-w-[80px] md:min-w-[100px]">
            <div className="text-2xl md:text-4xl font-bold text-saffron-400 glow-saffron">
              {time.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-1">
              {time.minutes === 1 ? 'Min' : 'Mins'}
            </div>
          </div>

          <div className="text-saffron-400 text-2xl md:text-3xl font-bold animate-pulse">:</div>

          {/* Seconds */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 md:p-6 shadow-lg border border-gray-700 min-w-[80px] md:min-w-[100px]">
            <div className="text-2xl md:text-4xl font-bold text-saffron-400 glow-saffron animate-pulse">
              {time.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-1">
              {time.seconds === 1 ? 'Sec' : 'Secs'}
            </div>
          </div>
        </div>

        {/* Detailed time info */}
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">
            Event begins at <strong className="text-saffron-400">{eventSettings?.startTime || 6}:00 AM</strong>
          </p>
          
          {eventSettings?.description && (
            <p className="text-gray-500 text-xs max-w-md mx-auto">
              {eventSettings.description}
            </p>
          )}
        </div>
      </div>

      {/* ✅ FIXED: Dynamic Messages Based on TOTAL Time Remaining with better logic */}
<div className="space-y-3">
  {/* More than 24 hours (1 day+) */}
  {time.totalSeconds > 24 * 3600 && (
    <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
      <p className="text-blue-400 font-semibold mb-1">
        📅 Event Tomorrow or Later!
      </p>
      <p className="text-gray-300 text-sm">
        Get ready for the spiritual journey ahead. Use this time to prepare your mind and spirit.
      </p>
    </div>
  )}

  {/* Between 6-24 hours */}
  {time.totalSeconds <= 24 * 3600 && time.totalSeconds > 6 * 3600 && (
    <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
      <p className="text-yellow-400 font-semibold mb-1">
        🌅 Event Today!
      </p>
      <p className="text-gray-300 text-sm">
        The sacred Ekadashi event starts today. Prepare your chanting beads and find a peaceful space.
      </p>
    </div>
  )}

  {/* ✅ FIXED: Between 2-6 hours - better messaging */}
  {time.totalSeconds <= 6 * 3600 && time.totalSeconds > 2 * 3600 && (
    <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4 animate-pulse">
      <p className="text-orange-400 font-semibold mb-1">
        🔥 Starting Very Soon!
      </p>
      <p className="text-gray-300 text-sm">
        {(() => {
          const hours = Math.floor(time.totalSeconds / 3600);
          const mins = Math.floor((time.totalSeconds % 3600) / 60);
          if (mins > 45) {
            return `Less than ${hours + 1} hours to go! Make sure you're ready to begin chanting.`;
          } else if (mins > 15) {
            return `About ${hours} hours ${mins} minutes to go! Make sure you're ready to begin chanting.`;
          } else {
            return `About ${hours} hours to go! Make sure you're ready to begin chanting.`;
          }
        })()}
      </p>
    </div>
  )}

  {/* ✅ FIXED: Between 1-2 hours */}
  {time.totalSeconds <= 2 * 3600 && time.totalSeconds > 1 * 3600 && (
    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 animate-pulse">
      <p className="text-red-400 font-semibold mb-1">
        ⚡ Less Than 2 Hours!
      </p>
      <p className="text-gray-300 text-sm">
        {(() => {
          const hours = Math.floor(time.totalSeconds / 3600);
          const mins = Math.floor((time.totalSeconds % 3600) / 60);
          if (mins > 45) {
            return `Less than 2 hours to go! Get your chanting beads ready.`;
          } else if (mins > 15) {
            return `About 1 hour ${mins} minutes to go! Get your chanting beads ready.`;
          } else {
            return `About 1 hour to go! Get your chanting beads ready.`;
          }
        })()}
      </p>
    </div>
  )}

  {/* Between 30 minutes - 1 hour */}
  {time.totalSeconds <= 1 * 3600 && time.totalSeconds > 30 * 60 && (
    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 animate-pulse">
      <p className="text-red-400 font-semibold mb-1">
        ⚡ Final Hour!
      </p>
      <p className="text-gray-300 text-sm">
        Less than an hour to go! The event starts in {Math.floor(time.totalSeconds / 60)} minutes!
      </p>
    </div>
  )}

  {/* ✅ FIXED: Final 30 minutes (only when TOTAL time <= 30 minutes) */}
  {time.totalSeconds <= 30 * 60 && time.totalSeconds > 10 * 60 && (
    <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 animate-pulse">
      <p className="text-green-400 font-bold mb-1">
        🎯 Final Half Hour!
      </p>
      <p className="text-gray-300 text-sm">
        Only {Math.floor(time.totalSeconds / 60)} minutes left! The spiritual journey is about to begin!
      </p>
    </div>
  )}

  {/* Final 10 minutes */}
  {time.totalSeconds <= 10 * 60 && time.totalSeconds > 60 && (
    <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 animate-pulse">
      <p className="text-green-400 font-bold mb-1">
        🎯 Final Minutes!
      </p>
      <p className="text-gray-300 text-sm">
        Only {Math.floor(time.totalSeconds / 60)} minute{Math.floor(time.totalSeconds / 60) !== 1 ? 's' : ''} left! The spiritual journey is about to begin!
      </p>
    </div>
  )}

  {/* Final 60 seconds */}
  {time.totalSeconds <= 60 && time.totalSeconds > 0 && (
    <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4 animate-bounce">
      <p className="text-purple-400 font-bold mb-1">
        🚀 Starting NOW!
      </p>
      <p className="text-gray-300 text-sm font-bold">
        {time.totalSeconds} second{time.totalSeconds !== 1 ? 's' : ''}... Get ready to chant!
      </p>
    </div>
  )}
</div>

      {/* ✅ Auto-refresh notification */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
        <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-updating every second</span>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          The app will automatically switch to the main event when the countdown reaches zero
        </p>
      </div>

      {/* ✅ Event Details Card */}
      <div className="bg-gradient-to-r from-saffron-900/10 to-devotional-gold/5 rounded-lg p-4 border border-saffron-500/20">
        <h4 className="text-lg font-semibold text-saffron-300 mb-3">📋 Event Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Target Rounds:</span>
            <span className="text-saffron-400 font-bold">{eventSettings?.globalGoal || 666}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Duration:</span>
            <span className="text-saffron-400 font-bold">
              {eventSettings?.startTime || 6}:00 - {eventSettings?.endTime || 24}:00
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Event Type:</span>
            <span className="text-saffron-400 font-bold">Collective Chanting</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Participation:</span>
            <span className="text-saffron-400 font-bold">Open to All</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
