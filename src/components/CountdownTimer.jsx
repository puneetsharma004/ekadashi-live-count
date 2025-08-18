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
      totalHours: Math.floor(totalSeconds / 3600) // Total hours for display
    };
  };

  const time = formatTimeLeft(timeLeft);
  
  // Generate countdown message based on time remaining
  const getCountdownMessage = () => {
    if (time.totalHours >= 24) {
      return `${time.days} day${time.days !== 1 ? 's' : ''} and ${time.hours} hour${time.hours !== 1 ? 's' : ''}`;
    } else if (time.totalHours >= 1) {
      return `${time.totalHours} hour${time.totalHours !== 1 ? 's' : ''} and ${time.minutes} minute${time.minutes !== 1 ? 's' : ''}`;
    } else if (time.minutes >= 1) {
      return `${time.minutes} minute${time.minutes !== 1 ? 's' : ''} and ${time.seconds} second${time.seconds !== 1 ? 's' : ''}`;
    } else {
      return `${time.seconds} second${time.seconds !== 1 ? 's' : ''}`;
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

      {/* ✅ Dynamic Messages Based on Time Remaining */}
      <div className="space-y-3">
        {time.totalHours > 24 && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
            <p className="text-blue-400 font-semibold mb-1">
              📅 Event Tomorrow!
            </p>
            <p className="text-gray-300 text-sm">
              Get ready for the spiritual journey ahead. Use this time to prepare your mind and spirit.
            </p>
          </div>
        )}

        {time.totalHours <= 24 && time.totalHours > 6 && (
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
            <p className="text-yellow-400 font-semibold mb-1">
              🌅 Event Today!
            </p>
            <p className="text-gray-300 text-sm">
              The sacred Ekadashi event starts today. Prepare your chanting beads and find a peaceful space.
            </p>
          </div>
        )}

        {time.totalHours <= 6 && time.totalHours > 1 && (
          <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4 animate-pulse">
            <p className="text-orange-400 font-semibold mb-1">
              🔥 Starting Very Soon!
            </p>
            <p className="text-gray-300 text-sm">
              Less than {time.totalHours} hours to go! Make sure you're ready to begin chanting.
            </p>
          </div>
        )}

        {time.totalHours <= 1 && time.minutes > 10 && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 animate-pulse">
            <p className="text-red-400 font-semibold mb-1">
              ⚡ Final Hour!
            </p>
            <p className="text-gray-300 text-sm">
              The event starts in less than an hour! Get your chanting beads ready.
            </p>
          </div>
        )}

        {time.minutes <= 10 && time.minutes > 0 && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 animate-pulse">
            <p className="text-green-400 font-bold mb-1">
              🎯 Final Minutes!
            </p>
            <p className="text-gray-300 text-sm">
              Only {time.minutes} minute{time.minutes !== 1 ? 's' : ''} left! The spiritual journey is about to begin!
            </p>
          </div>
        )}

        {time.minutes === 0 && time.seconds <= 30 && time.seconds > 0 && (
          <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4 animate-bounce">
            <p className="text-purple-400 font-bold mb-1">
              🚀 Starting NOW!
            </p>
            <p className="text-gray-300 text-sm font-bold">
              {time.seconds}... Get ready to chant!
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
