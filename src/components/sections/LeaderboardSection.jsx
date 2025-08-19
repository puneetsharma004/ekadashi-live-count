import React from 'react';
import Leaderboard from '../Leaderboard';

const LeaderboardSection = () => {
  return (
    <div className="space-y-6">
      {/* Leaderboard Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient-saffron mb-2">
          🏆 Live Rankings
        </h1>
        <p className="text-gray-300">
          See how you rank among fellow devotees
        </p>
      </div>

      {/* Leaderboard Component */}
      <div className="card-devotional">
        <Leaderboard />
      </div>

      {/* Inspirational Message */}
      <div className="card-devotional bg-gradient-to-r from-devotional-gold/10 to-saffron-500/5 border-devotional-gold/20 text-center">
        <div className="mb-3">
          <span className="text-4xl">⭐</span>
        </div>
        <p className="text-gray-300 mb-2">
          Remember, this isn't just a competition — it's a collective journey of devotion!
        </p>
        <p className="text-devotional-gold text-sm font-semibold">
          Every round chanted brings us closer to Krishna 🌟
        </p>
      </div>
    </div>
  );
};

export default LeaderboardSection;
