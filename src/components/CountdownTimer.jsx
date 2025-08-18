import React, { useState, useEffect } from 'react';
import { getTimeUntilStart } from '../services/firebase';
import { getTimeFromNow } from '../utils/validation';

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isEventStarted, setIsEventStarted] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const millisUntilStart = getTimeUntilStart();
      
      if (millisUntilStart <= 0) {
        setIsEventStarted(true);
        setTimeLeft(0);
        // Auto refresh page when event starts
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setTimeLeft(millisUntilStart);
      }
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (isEventStarted) {
    return (
      <div className="text-center">
        <div className="bg-gradient-to-r from-saffron-500 to-devotional-gold rounded-lg p-6 glow-saffron">
          <h3 className="text-xl font-bold text-white mb-2">
            🎉 Event Started!
          </h3>
          <p className="text-white/90">
            Refreshing page...
          </p>
        </div>
      </div>
    );
  }

  const formatTimeLeft = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const time = formatTimeLeft(timeLeft);

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-300 mb-6">
        Event starts in:
      </h3>
      
      <div className="flex justify-center space-x-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 min-w-[70px]">
          <div className="text-2xl font-bold text-saffron-400 glow-saffron">
            {time.hours}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Hours
          </div>
        </div>
        
        <div className="flex items-center text-saffron-400 text-2xl font-bold">
          :
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 min-w-[70px]">
          <div className="text-2xl font-bold text-saffron-400 glow-saffron">
            {time.minutes}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Minutes
          </div>
        </div>
        
        <div className="flex items-center text-saffron-400 text-2xl font-bold">
          :
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 min-w-[70px]">
          <div className="text-2xl font-bold text-saffron-400 glow-saffron animate-pulse">
            {time.seconds}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Seconds
          </div>
        </div>
      </div>
      
      <p className="text-gray-400 text-sm">
        The chanting event begins at 6:00 AM
      </p>
    </div>
  );
};

export default CountdownTimer;
