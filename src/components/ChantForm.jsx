import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserChantCount } from '../services/firebase.js';
import { validateChantRounds } from '../utils/validation.js';

const ChantForm = () => {
  const { user, updateUserChantCount: updateAuthUser } = useAuth();
  const [rounds, setRounds] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pendingSubmissions, setPendingSubmissions] = useState([]);

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

    setLoading(true);
    
    try {
      // Attempt to update Firebase
      const result = await updateUserChantCount(user.id, validation.rounds);
      
      if (result.success) {
        // Update local auth state
        const newTotal = user.chantCount + validation.rounds;
        updateAuthUser(newTotal);
        
        setMessage({ 
          type: 'success', 
          text: `✅ Added ${validation.rounds} rounds! Your total: ${newTotal}` 
        });
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

  const retrySubmission = async (submission) => {
    try {
      const result = await updateUserChantCount(user.id, submission.rounds);
      
      if (result.success) {
        // Remove from pending submissions
        setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
        
        // Update auth state
        const newTotal = user.chantCount + submission.rounds;
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

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-300 mb-4 text-center">
        Submit Your Chant Rounds
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rounds" className="block text-sm font-medium text-gray-300 mb-2">
            Number of Rounds Completed
          </label>
          <input
            type="text"
            id="rounds"
            value={rounds}
            onChange={handleInputChange}
            placeholder="Enter number of rounds"
            className="input-devotional text-center text-lg font-semibold"
            disabled={loading}
            autoComplete="off"
          />
          <p className="text-gray-400 text-xs mt-1 text-center">
            Enter only positive numbers (1-1000)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !rounds.trim()}
          className="w-full btn-saffron text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="spinner mr-2"></div>
              Submitting...
            </span>
          ) : (
            <>
              🕉️ Submit Rounds
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
  );
};

export default ChantForm;
