import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  updateEventSettings, 
  subscribeToGlobalCount, 
  subscribeToLeaderboard,
  DYNAMIC_GLOBAL_GOAL,
  DYNAMIC_EVENT_START_TIME,
  DYNAMIC_EVENT_END_TIME,
  DEV_MODE,
  ADMIN_PHONE
} from '../services/firebase';

const AdminPanel = () => {
  const { user } = useAuth();
  const [globalCount, setGlobalCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [settings, setSettings] = useState({
    globalGoal: DYNAMIC_GLOBAL_GOAL,
    startTime: DYNAMIC_EVENT_START_TIME,
    endTime: DYNAMIC_EVENT_END_TIME
  });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Subscribe to real-time data
    const unsubscribeCount = subscribeToGlobalCount(setGlobalCount);
    const unsubscribeLeaderboard = subscribeToLeaderboard(setParticipants);

    return () => {
      unsubscribeCount();
      unsubscribeLeaderboard();
    };
  }, []);

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const result = await updateEventSettings({
        globalGoal: parseInt(settings.globalGoal),
        startTime: parseInt(settings.startTime),
        endTime: parseInt(settings.endTime)
      });

      if (result.success) {
        setMessage({ type: 'success', text: '✅ Settings updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const activeParticipants = participants.filter(p => p.chantCount > 0);
  const progressPercentage = ((globalCount / settings.globalGoal) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="card-devotional bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30">
        <h2 className="text-2xl font-bold text-red-400 mb-2 text-center">
          🔧 Admin Control Panel
        </h2>
        <p className="text-center text-gray-300">
          Welcome, Admin {user?.fullName} 
          {DEV_MODE && <span className="ml-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs">DEV MODE</span>}
        </p>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-devotional text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Global Count</h3>
          <div className="text-3xl font-bold text-saffron-400">{globalCount}</div>
        </div>
        <div className="card-devotional text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Progress</h3>
          <div className="text-3xl font-bold text-devotional-gold">{progressPercentage}%</div>
        </div>
        <div className="card-devotional text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Users</h3>
          <div className="text-3xl font-bold text-blue-400">{participants.length}</div>
        </div>
        <div className="card-devotional text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Active</h3>
          <div className="text-3xl font-bold text-green-400">{activeParticipants.length}</div>
        </div>
      </div>

      {/* Event Settings */}
      <div className="card-devotional">
        <h3 className="text-xl font-semibold text-gray-300 mb-4">Event Settings</h3>
        
        <form onSubmit={handleSettingsUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Global Goal (Rounds)
              </label>
              <input
                type="number"
                name="globalGoal"
                value={settings.globalGoal}
                onChange={handleInputChange}
                min="1"
                max="10000"
                className="input-devotional"
                disabled={updating}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time (24hr)
              </label>
              <input
                type="number"
                name="startTime"
                value={settings.startTime}
                onChange={handleInputChange}
                min="0"
                max="23"
                className="input-devotional"
                disabled={updating}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Time (24hr)
              </label>
              <input
                type="number"
                name="endTime"
                value={settings.endTime}
                onChange={handleInputChange}
                min="1"
                max="24"
                className="input-devotional"
                disabled={updating}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full btn-saffron disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <span className="flex items-center justify-center">
                <div className="spinner mr-2"></div>
                Updating Settings...
              </span>
            ) : (
              '🔧 Update Event Settings'
            )}
          </button>
        </form>

        {message.text && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/20 border border-green-500/50 text-green-400'
              : 'bg-red-900/20 border border-red-500/50 text-red-400'
          }`}>
            <p className="text-sm text-center">{message.text}</p>
          </div>
        )}
      </div>

      {/* Top Performers */}
      <div className="card-devotional">
        <h3 className="text-xl font-semibold text-gray-300 mb-4">Top Performers</h3>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {participants.slice(0, 10).map((participant, index) => (
            <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
              <div className="flex items-center">
                <span className="w-6 text-center font-bold text-saffron-400">
                  {index + 1}.
                </span>
                <span className="ml-2 text-white">{participant.fullName}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-saffron-400">{participant.chantCount}</div>
                <div className="text-xs text-gray-400">{participant.phone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Development Tools */}
      {DEV_MODE && (
        <div className="card-devotional bg-yellow-900/10 border-yellow-500/30">
          <h3 className="text-xl font-semibold text-yellow-400 mb-4">🛠️ Development Tools</h3>
          <div className="text-yellow-300 text-sm space-y-2">
            <p>• DEV_MODE is enabled - time constraints are bypassed</p>
            <p>• Event is always ACTIVE for testing</p>
            <p>• Change DEV_MODE to false in firebase.js for production</p>
            <p>• Admin phone: {ADMIN_PHONE}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
