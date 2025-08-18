import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChantForm from '../components/ChantForm';
import ProgressBar from '../components/ProgressBar';
import Leaderboard from '../components/Leaderboard';
import { subscribeToGlobalCount, GLOBAL_GOAL, DYNAMIC_GLOBAL_GOAL, isAdmin } from '../services/firebase.js';
import AdminPanel from '../components/AdminPanel.jsx';

const Home = () => {
  const { user } = useAuth();
  const [globalCount, setGlobalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

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

  const progressPercentage = Math.min((globalCount / DYNAMIC_GLOBAL_GOAL) * 100, 100);

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
        <AdminPanel />
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
              🔧 Admin Panel
            </button>
          </div>
        )}
      </div>

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
            Total Progress
          </h3>
          <div className="text-4xl font-bold text-devotional-gold glow-saffron">
            {loading ? (
              <div className="spinner mx-auto"></div>
            ) : (
              `${globalCount}`
            )}
          </div>
          <p className="text-gray-400 text-sm mt-2">
            out of {DYNAMIC_GLOBAL_GOAL} rounds
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
          total={DYNAMIC_GLOBAL_GOAL}
          loading={loading}
        />
        <div className="text-center mt-4">
          <span className="text-2xl font-bold text-gradient-saffron">
            {loading ? '...' : `${progressPercentage.toFixed(1)}%`}
          </span>
          <span className="text-gray-400 ml-2">completed</span>
        </div>
      </div>

      {/* Chant Submission Form */}
      <div className="card-devotional">
        <ChantForm />
      </div>

      {/* Leaderboard */}
      <div className="card-devotional">
        <Leaderboard />
      </div>

      {/* Motivational Message */}
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
            Congratulations! We've reached our collective goal of {GLOBAL_GOAL} rounds!
          </p>
          <p className="text-saffron-300 mt-2">
            Hare Krishna! 🙏✨
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
