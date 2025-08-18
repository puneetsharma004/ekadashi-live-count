import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  updateEventSettings,
  subscribeToGlobalCount, 
  subscribeToLeaderboard,
  createNewEvent,
  startEvent,
  stopEvent,
  completeEvent,
  archiveCurrentEvent,
  getEventsHistory,
  getCurrentEvent,
  DEV_MODE,
  ADMIN_PHONE
} from '../services/firebase';

const EnhancedAdminPanel = ({ eventSettings }) => {
  const { user } = useAuth();
  const [globalCount, setGlobalCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [eventsHistory, setEventsHistory] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, create, history
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // New event form state
  const [newEventForm, setNewEventForm] = useState({
    eventName: '',
    globalGoal: 666,
    startTime: 6,
    endTime: 24,
    description: ''
  });

  useEffect(() => {
    const unsubscribeCount = subscribeToGlobalCount(setGlobalCount);
    const unsubscribeLeaderboard = subscribeToLeaderboard(setParticipants);

    // Load events history
    loadEventsHistory();

    return () => {
      unsubscribeCount();
      unsubscribeLeaderboard();
    };
  }, []);

  const loadEventsHistory = async () => {
    const result = await getEventsHistory(5);
    if (result.success) {
      setEventsHistory(result.events);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Event control handlers
  const handleStartEvent = async () => {
    if (window.confirm('Start the event now? All users will be able to submit chants.')) {
      setLoading(true);
      const result = await startEvent();
      if (result.success) {
        showMessage('success', '🎉 Event started successfully!');
      } else {
        showMessage('error', `Failed to start event: ${result.error}`);
      }
      setLoading(false);
    }
  };

  const handleStopEvent = async () => {
    if (window.confirm('Stop the event? Users will not be able to submit new chants.')) {
      setLoading(true);
      const result = await stopEvent();
      if (result.success) {
        showMessage('success', '⏸️ Event stopped successfully!');
      } else {
        showMessage('error', `Failed to stop event: ${result.error}`);
      }
      setLoading(false);
    }
  };

  const handleCompleteEvent = async () => {
    if (window.confirm('Complete this event? This will finalize all stats and prepare for archiving.')) {
      setLoading(true);
      const result = await completeEvent();
      if (result.success) {
        showMessage('success', '✅ Event completed successfully!');
        loadEventsHistory();
      } else {
        showMessage('error', `Failed to complete event: ${result.error}`);
      }
      setLoading(false);
    }
  };

  const handleCreateNewEvent = async (e) => {
    e.preventDefault();
    
    if (window.confirm('Create new event? This will archive the current event and clear all participant data.')) {
      setLoading(true);
      const result = await createNewEvent(newEventForm);
      if (result.success) {
        showMessage('success', '🎊 New event created successfully!');
        setCurrentView('dashboard');
        setNewEventForm({
          eventName: '',
          globalGoal: 666,
          startTime: 6,
          endTime: 24,
          description: ''
        });
        loadEventsHistory();
      } else {
        showMessage('error', `Failed to create event: ${result.error}`);
      }
      setLoading(false);
    }
  };

  const handleArchiveCurrentEvent = async () => {
    if (window.confirm('Archive current event? This will clear all participant data and save event history.')) {
      setLoading(true);
      const result = await archiveCurrentEvent();
      if (result.success) {
        showMessage('success', '📁 Event archived successfully!');
        loadEventsHistory();
      } else {
        showMessage('error', `Failed to archive event: ${result.error}`);
      }
      setLoading(false);
    }
  };

  const activeParticipants = participants.filter(p => p.chantCount > 0);
  const progressPercentage = eventSettings?.globalGoal ? 
    ((globalCount / eventSettings.globalGoal) * 100).toFixed(1) : 0;

  const eventStatus = eventSettings?.eventActive ? 'Active' : 
                    eventSettings?.status === 'completed' ? 'Completed' : 'Stopped';

  return (
    <div className="space-y-6">
      {/* Admin Header with Navigation */}
      <div className="card-devotional bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-red-400 mb-2 sm:mb-0">
            🔧 Advanced Event Manager
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                currentView === 'dashboard' ? 'bg-saffron-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('create')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                currentView === 'create' ? 'bg-saffron-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Create Event
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                currentView === 'history' ? 'bg-saffron-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              History
            </button>
          </div>
        </div>
        
        <div className="text-center text-gray-300">
          <p>Welcome, Admin {user?.fullName}</p>
          <p className="text-sm">
            Current Event: 
            <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
              eventStatus === 'Active' ? 'bg-green-500 text-white' :
              eventStatus === 'Completed' ? 'bg-blue-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {eventStatus}
            </span>
            {DEV_MODE && <span className="ml-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs">DEV MODE</span>}
          </p>
        </div>
      </div>

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <>
          {/* Event Controls */}
          <div className="card-devotional">
            <h3 className="text-xl font-semibold text-gray-300 mb-4">Event Controls</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={handleStartEvent}
                disabled={loading || eventSettings?.eventActive}
                className="btn-saffron disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎯 Start Event
              </button>
              
              <button
                onClick={handleStopEvent}
                disabled={loading || !eventSettings?.eventActive}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏸️ Stop Event
              </button>
              
              <button
                onClick={handleCompleteEvent}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Complete Event
              </button>
              
              <button
                onClick={handleArchiveCurrentEvent}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📁 Archive Event
              </button>
            </div>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-devotional text-center">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Global Count</h3>
              <div className="text-3xl font-bold text-saffron-400">{globalCount}</div>
              <div className="text-sm text-gray-400">of {eventSettings?.globalGoal || 666}</div>
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
        </>
      )}

      {/* Create New Event View */}
      {currentView === 'create' && (
        <div className="card-devotional">
          <h3 className="text-xl font-semibold text-gray-300 mb-4">Create New Event</h3>
          
          <form onSubmit={handleCreateNewEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={newEventForm.eventName}
                  onChange={(e) => setNewEventForm(prev => ({...prev, eventName: e.target.value}))}
                  placeholder="e.g., Ekadashi Chanting Marathon 2025"
                  className="input-devotional"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Rounds
                </label>
                <input
                  type="number"
                  value={newEventForm.globalGoal}
                  onChange={(e) => setNewEventForm(prev => ({...prev, globalGoal: parseInt(e.target.value)}))}
                  min="1"
                  max="10000"
                  className="input-devotional"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time (24hr)
                </label>
                <input
                  type="number"
                  value={newEventForm.startTime}
                  onChange={(e) => setNewEventForm(prev => ({...prev, startTime: parseInt(e.target.value)}))}
                  min="0"
                  max="23"
                  className="input-devotional"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time (24hr)
                </label>
                <input
                  type="number"
                  value={newEventForm.endTime}
                  onChange={(e) => setNewEventForm(prev => ({...prev, endTime: parseInt(e.target.value)}))}
                  min="1"
                  max="24"
                  className="input-devotional"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Description
              </label>
              <textarea
                value={newEventForm.description}
                onChange={(e) => setNewEventForm(prev => ({...prev, description: e.target.value}))}
                placeholder="Describe the event purpose, special instructions, etc."
                rows="3"
                className="input-devotional resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-saffron disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Creating New Event...
                </span>
              ) : (
                '🎊 Create New Event'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Events History View */}
      {currentView === 'history' && (
        <div className="card-devotional">
          <h3 className="text-xl font-semibold text-gray-300 mb-4">Events History</h3>
          
          {eventsHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No previous events found.</p>
          ) : (
            <div className="space-y-4">
              {eventsHistory.map((event, index) => (
                <div key={event.id} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-white">
                      {event.eventName || `Event ${index + 1}`}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {event.archivedAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Target:</span>
                      <div className="text-saffron-400 font-bold">{event.globalGoal}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Achieved:</span>
                      <div className="text-green-400 font-bold">{event.finalStats?.totalRounds || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Participants:</span>
                      <div className="text-blue-400 font-bold">{event.finalStats?.totalParticipants || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Active:</span>
                      <div className="text-purple-400 font-bold">{event.finalStats?.activeParticipants || 0}</div>
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-300 text-sm mt-2">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {message.text && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          message.type === 'success' 
            ? 'bg-green-900/90 border border-green-500/50 text-green-400'
            : 'bg-red-900/90 border border-red-500/50 text-red-400'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Development Tools */}
      {DEV_MODE && (
        <div className="card-devotional bg-yellow-900/10 border-yellow-500/30">
          <h3 className="text-xl font-semibold text-yellow-400 mb-4">🛠️ Development Tools</h3>
          <div className="text-yellow-300 text-sm space-y-2">
            <p>• DEV_MODE is enabled - manual event control available</p>
            <p>• Time constraints are bypassed in development</p>
            <p>• Admin phone: {ADMIN_PHONE}</p>
            <p>• Use "Create Event" to test full lifecycle</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminPanel;
