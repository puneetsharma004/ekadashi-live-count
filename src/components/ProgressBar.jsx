import React from 'react';

const ProgressBar = ({ current, total, loading }) => {
  const percentage = Math.min((current / total) * 100, 100);
  const remaining = Math.max(total - current, 0);

  // Color logic based on progress
  const getProgressColor = (percent) => {
    if (percent >= 100) return 'from-devotional-gold to-yellow-400';
    if (percent >= 75) return 'from-green-400 to-saffron-400';
    if (percent >= 50) return 'from-saffron-400 to-saffron-500';
    if (percent >= 25) return 'from-orange-400 to-saffron-400';
    return 'from-red-400 to-orange-400';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="progress-bar">
          <div className="h-full bg-gradient-to-r from-gray-600 to-gray-500 animate-pulse rounded-full"></div>
        </div>
        <div className="text-center text-gray-400">
          Loading progress...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="progress-bar">
        <div 
          className={`progress-fill bg-gradient-to-r ${getProgressColor(percentage)} relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shine effect */}
          {percentage > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse-slow"></div>
          )}
        </div>
      </div>

      {/* Progress stats */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-gray-400">
          <span className="font-medium text-white">{current}</span> completed
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gradient-saffron">
            {percentage.toFixed(1)}%
          </div>
        </div>
        
        <div className="text-gray-400 text-right">
          <span className="font-medium text-white">{remaining}</span> remaining
        </div>
      </div>

      {/* Milestone indicators */}
      <div className="flex justify-between text-xs text-gray-500 relative">
        {[25, 50, 75, 100].map((milestone) => {
          const milestoneValue = Math.floor((milestone / 100) * total);
          const isReached = current >= milestoneValue;
          
          return (
            <div 
              key={milestone}
              className={`flex flex-col items-center ${isReached ? 'text-saffron-400' : 'text-gray-500'}`}
            >
              <div className={`w-2 h-2 rounded-full mb-1 ${
                isReached ? 'bg-saffron-400 glow-saffron' : 'bg-gray-600'
              }`}></div>
              <span>{milestone}%</span>
            </div>
          );
        })}
      </div>

      {/* Achievement messages */}
      {percentage >= 100 && (
        <div className="text-center p-3 bg-gradient-to-r from-devotional-gold/20 to-saffron-500/20 rounded-lg border border-devotional-gold/30">
          <p className="text-devotional-gold font-bold">
            🎊 GOAL ACHIEVED! 🎊
          </p>
        </div>
      )}
      
      {percentage >= 75 && percentage < 100 && (
        <div className="text-center p-2 bg-green-900/20 rounded-lg border border-green-500/30">
          <p className="text-green-400 font-medium">
            🌟 Almost there! Final push!
          </p>
        </div>
      )}
      
      {percentage >= 50 && percentage < 75 && (
        <div className="text-center p-2 bg-saffron-900/20 rounded-lg border border-saffron-500/30">
          <p className="text-saffron-400 font-medium">
            🚀 Halfway there! Keep going!
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
