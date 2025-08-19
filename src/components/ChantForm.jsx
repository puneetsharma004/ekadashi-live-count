import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext'; // ✅ Fixed path
import { updateUserChantCount, setUserTotalChantCount, subscribeToUserChantCount } from '../services/firebase.js';
import { validateChantRounds } from '../utils/validation.js';

const ChantForm = () => {
  const { user, updateUserChantCount: updateAuthUser } = useAuth();
  const [userChantCount, setUserChantCount] = useState(user?.chantCount  || 0); // ✅ Add this line
  const [rounds, setRounds] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [isAdditiveMode, setIsAdditiveMode] = useState(false); // ✅ NEW: Toggle between modes


  


  const clearMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    const validation = validateChantRounds(rounds);
    if (!validation.isValid) {
      setMessage({ type: 'error', text: validation.error });
      clearMessage();
      return;
    }

    // Additional validation for replacement mode
    if (!isAdditiveMode && validation.rounds < (userChantCount  || 0)) {
      const confirmDecrease = window.confirm(
        `This will decrease your count from ${userChantCount  || 0} to ${validation.rounds}. Are you sure?`
      );
      if (!confirmDecrease) return;
    }

    setLoading(true);
    
    try {
      let result;
      let newTotal;

      if (isAdditiveMode) {
        // ✅ ADDITIVE MODE: Add new rounds to existing total
        result = await updateUserChantCount(user.id, validation.rounds);
        newTotal = (userChantCount  || 0) + validation.rounds;
      } else {
        // ✅ REPLACEMENT MODE: Set total to the entered number
        result = await setUserTotalChantCount(user.id, validation.rounds);
        newTotal = validation.rounds;
      }
      
      if (result.success) {
        // Update local auth state
        updateAuthUser(newTotal);
        
        const successMessage = isAdditiveMode
          ? `✅ Added ${validation.rounds} rounds! Your total: ${newTotal}`
          : `✅ Updated to ${newTotal} total rounds! ${
              validation.rounds > (userChantCount  || 0) 
                ? `(+${validation.rounds - (userChantCount  || 0)})` 
                : validation.rounds < (userChantCount  || 0)
                  ? `(${validation.rounds - (userChantCount  || 0)})`
                  : ''
            }`;

        setMessage({ type: 'success', text: successMessage });
        setRounds('');
        clearMessage();
      } else {
        throw new Error(result.error || 'Failed to update count');
      }
    } catch (error) {
      console.error('Submission error:', error);
      
      // Store submission for retry (offline support)
      const submission = {
        id: Date.now(),
        rounds: validation.rounds,
        isAdditive: isAdditiveMode,
        timestamp: new Date().toISOString()
      };
      
      setPendingSubmissions(prev => [...prev, submission]);
      
      setMessage({ 
        type: 'warning', 
        text: `⚠️ Connection issue. ${validation.rounds} rounds saved locally and will retry automatically.` 
      });
      
      // Try to retry after 3 seconds
      setTimeout(() => retrySubmission(submission), 3000);
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Subscribe to real-time user chant count updates
useEffect(() => {
  if (!user?.id) return;

  const unsubscribeUser = subscribeToUserChantCount(user.id, (chantCount) => {
    setUserChantCount(chantCount);
  });

  return () => unsubscribeUser();
}, [user?.id]);

  const retrySubmission = async (submission) => {
    try {
      let result;
      let newTotal;

      if (submission.isAdditive) {
        result = await updateUserChantCount(user.id, submission.rounds);
        newTotal = (userChantCount  || 0) + submission.rounds;
      } else {
        result = await setUserTotalChantCount(user.id, submission.rounds);
        newTotal = submission.rounds;
      }
      
      if (result.success) {
        // Remove from pending submissions
        setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
        
        // Update auth state
        updateAuthUser(newTotal);
        
        setMessage({
          type: 'success',
          text: `✅ Successfully synced ${submission.rounds} rounds!`
        });
        clearMessage();
      } else {
        // Keep in pending for next retry
        setTimeout(() => retrySubmission(submission), 10000); // Retry in 10 seconds
      }
    } catch (error) {
      // Keep in pending for next retry
      setTimeout(() => retrySubmission(submission), 10000);
    }
  };
  

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setRounds(value);
    }
  };

  // ✅ NEW: Toggle between modes
  const handleModeToggle = () => {
    setIsAdditiveMode(!isAdditiveMode);
    setRounds(''); // Clear input when switching modes
    setMessage({ type: '', text: '' }); // Clear any existing messages
  };

  return (
    <div className="space-y-6">
      {/* ✅ NEW: Mode Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-lg p-1 flex">
          <button
            type="button"
            onClick={handleModeToggle}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              !isAdditiveMode
                ? 'bg-saffron-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            📊 Update Total
          </button>
          <button
            type="button"
            onClick={handleModeToggle}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isAdditiveMode
                ? 'bg-saffron-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            ➕ Add New
          </button>
        </div>
      </div>

      {/* ✅ DYNAMIC: Instructions based on mode */}
      <div className="bg-gradient-to-r from-saffron-900/10 to-devotional-gold/5 border border-saffron-500/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-saffron-300 mb-3 flex items-center">
          📋 How to Submit Your Chanted Rounds
        </h3>
        
        <div className="space-y-3 text-sm">
          {!isAdditiveMode ? (
            // ✅ REPLACEMENT MODE INSTRUCTIONS
            <>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-saffron-400 font-semibold mb-2">🔢 Update Total Mode (Recommended)</h4>
                <div className="text-gray-300 space-y-1">
                  <p>• <strong>Current total:</strong> {userChantCount} rounds</p>
                  <p>• <strong>Enter:</strong> Your NEW total number of rounds chanted</p>
                  <p>• <strong>System:</strong> Will UPDATE your total to this number</p>
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-blue-400 font-semibold mb-2">✅ Example</h4>
                <div className="text-gray-300 text-xs space-y-1">
                  <p>10:00 AM - You have 0, chant 2 rounds → Enter: <strong>2</strong> → Total becomes: <strong>2</strong></p>
                  <p>12:00 PM - You chant 12 more (total 14) → Enter: <strong>14</strong> → Total becomes: <strong>14</strong></p>
                  <p>2:00 PM - You chant 5 more (total 19) → Enter: <strong>19</strong> → Total becomes: <strong>19</strong></p>
                </div>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <h4 className="text-green-400 font-semibold mb-2">💡 Pro Tip</h4>
                <div className="text-gray-300 text-xs">
                  <p>Just count your total rounds chanted and enter that number. Simple!</p>
                </div>
              </div>
            </>
          ) : (
            // ✅ ADDITIVE MODE INSTRUCTIONS
            <>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-saffron-400 font-semibold mb-2">🔢 Add New Rounds Mode</h4>
                <div className="text-gray-300 space-y-1">
                  <p>• <strong>Current total:</strong> {userChantCount  || 0} rounds</p>
                  <p>• <strong>Submit:</strong> Only the NEW rounds you just chanted</p>
                  <p>• <strong>System:</strong> Will ADD your new rounds to existing total</p>
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-blue-400 font-semibold mb-2">✅ Example</h4>
                <div className="text-gray-300 text-xs space-y-1">
                  <p>10:00 AM - You submit: <strong>2 rounds</strong> → Total becomes: <strong>2</strong></p>
                  <p>12:00 PM - You chant 12 more → Submit: <strong>12 rounds</strong> → Total becomes: <strong>14</strong></p>
                  <p>2:00 PM - You chant 5 more → Submit: <strong>5 rounds</strong> → Total becomes: <strong>19</strong></p>
                </div>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <h4 className="text-red-400 font-semibold mb-2">❌ Don't Do This</h4>
                <div className="text-gray-300 text-xs">
                  <p>Don't submit your total count - only submit NEW rounds chanted!</p>
                  <p>If you have 10 total and chant 3 more, submit <strong>3</strong> (not 13)</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-300 mb-4 text-center">
          {isAdditiveMode ? 'Submit New Chanted Rounds' : 'Update Your Total Chanted Rounds'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rounds" className="block text-sm font-medium text-gray-300 mb-2">
              {isAdditiveMode 
                ? 'Number of NEW rounds chanted:' 
                : 'Your TOTAL number of rounds chanted:'
              }
            </label>
            <input
              type="text"
              id="rounds"
              value={rounds}
              onChange={handleInputChange}
              placeholder={
                isAdditiveMode 
                  ? "Enter new rounds (e.g., 5)" 
                  : "Enter your total rounds (e.g., 14)"
              }
              className="input-devotional text-center text-lg font-semibold"
              disabled={loading}
              autoComplete="off"
            />
            <div className="mt-2 text-xs space-y-1">
              <p className="text-gray-400 text-center">
                Current total: <strong>{userChantCount  || 0}</strong> rounds
              </p>
              {!isAdditiveMode && rounds && parseInt(rounds) !== (userChantCount  || 0) && (
                <p className={`font-semibold text-center ${
                  parseInt(rounds) > (userChantCount  || 0) 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}>
                  Change: {parseInt(rounds) > (userChantCount  || 0) ? '+' : ''}{parseInt(rounds) - (userChantCount  || 0)} rounds
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !rounds.trim() || (!isAdditiveMode && parseInt(rounds) === (userChantCount  || 0))}
            className="w-full btn-saffron text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="spinner mr-2"></div>
                Submitting...
              </span>
            ) : (
              <>
                {isAdditiveMode ? `➕ Add ${rounds || '...'} Rounds` : `🔄 Update to ${rounds || '...'} Rounds`}
              </>
            )}
          </button>
        </form>

        {/* Messages */}
        {message.text && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-900/20 border border-green-500/50 text-green-400' :
            message.type === 'warning' ? 'bg-yellow-900/20 border border-yellow-500/50 text-yellow-400' :
            'bg-red-900/20 border border-red-500/50 text-red-400'
          }`}>
            <p className="text-sm text-center">{message.text}</p>
          </div>
        )}

        {/* Pending submissions indicator */}
        {pendingSubmissions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/50 rounded-lg">
            <p className="text-blue-400 text-sm text-center">
              📡 {pendingSubmissions.length} submission(s) syncing...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChantForm;
