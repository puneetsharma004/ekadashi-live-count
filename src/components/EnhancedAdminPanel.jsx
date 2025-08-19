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
  ADMIN_PHONE,
  // ✅ ADD: Import Firebase functions for delete
  db,
  USERS_COLLECTION
} from '../services/firebase';

// ✅ ADD: Firebase delete import
import { doc, deleteDoc } from 'firebase/firestore';

// ✅ ADD: Import swipe functionality
import { useSwipeable } from 'react-swipeable';

// ✅ NEW: Swipeable Participant Row Component
const SwipeableParticipantRow = ({ participant, onCall, onDelete, isSelected, onSelect, showCheckbox }) => {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setSwipeDirection('delete');
      setIsSwipeOpen(true);
    },
    onSwipedRight: () => {
      setSwipeDirection('call');
      setIsSwipeOpen(true);
    },
    onTap: () => {
      setIsSwipeOpen(false);
      setSwipeDirection(null);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const handleAction = () => {
    if (swipeDirection === 'call') {
      onCall(participant);
    } else if (swipeDirection === 'delete') {
      onDelete(participant.id);
    }
    setIsSwipeOpen(false);
    setSwipeDirection(null);
  };

  return (
    <div 
      {...handlers}
      className="relative overflow-hidden bg-gray-800/50 rounded-lg shadow-sm border border-gray-600/50 mb-2"
    >
      {/* Main Content */}
      <div 
        className={`flex items-center p-4 transition-transform duration-200 ${
          isSwipeOpen 
            ? swipeDirection === 'call' 
              ? 'transform translate-x-16' 
              : 'transform -translate-x-16'
            : ''
        }`}
      >
        {/* Desktop Multi-Select Checkbox */}
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(participant.id, e.target.checked)}
            className="mr-3 hidden md:block"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h4 className="font-medium text-white truncate">{participant.fullName}</h4>
            {/* Role Badge */}
            {participant.role === 'DEVOTEE' && (
              <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded">
                Devotee
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{participant.phone}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{participant.chantCount} rounds</span>
            <span>{(participant.chantCount * 1728).toLocaleString()} names</span>
            {participant.lastUpdated && (
              <span>
                Active: {new Date(participant.lastUpdated.toDate()).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        </div>
        
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex space-x-2 flex-shrink-0">
          <button
            onClick={() => onCall(participant)}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            title="Call Participant"
          >
            📞
          </button>
          <button
            onClick={() => onDelete(participant.id)}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
            title="Delete Participant"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Mobile Swipe Action Indicators */}
      {isSwipeOpen && (
        <>
          {swipeDirection === 'call' && (
            <div 
              className="absolute left-0 top-0 h-full w-16 bg-green-600 flex items-center justify-center cursor-pointer md:hidden z-10"
              onClick={handleAction}
            >
              <span className="text-white text-2xl">📞</span>
            </div>
          )}
          
          {swipeDirection === 'delete' && (
            <div 
              className="absolute right-0 top-0 h-full w-16 bg-red-600 flex items-center justify-center cursor-pointer md:hidden z-10"
              onClick={handleAction}
            >
              <span className="text-white text-2xl">🗑️</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EnhancedAdminPanel = ({ eventSettings }) => {
  const { user } = useAuth();
  const [globalCount, setGlobalCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [eventsHistory, setEventsHistory] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, create, history, participants
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ✅ NEW: Participant management state
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [participantFilter, setParticipantFilter] = useState('all'); // all, active, inactive

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

  // ✅ NEW: Call participant function
  const handleCallParticipant = (participant) => {
    try {
      // Clean the number (remove any spaces, dashes, special characters)
      const cleanNumber = participant.phone.replace(/\D/g, '');
      
      // Format for calling - append +91 if needed
      const callNumber = cleanNumber.startsWith('91') && cleanNumber.length === 12
        ? `+${cleanNumber}` 
        : `+91${cleanNumber}`;
      
      // Make the call
      window.open(`tel:${callNumber}`);
      
      showMessage('success', `📞 Calling ${participant.fullName} at ${callNumber}`);
      console.log(`Calling ${participant.fullName} at ${callNumber}`);
    } catch (error) {
      showMessage('error', 'Failed to initiate call');
      console.error('Call error:', error);
    }
  };

  // ✅ NEW: Delete participant function
  const handleDeleteParticipant = async (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    if (window.confirm(`Are you sure you want to delete "${participant.fullName}"?\n\nThis action cannot be undone.`)) {
      try {
        setLoading(true);
        
        // Delete from Firebase
        await deleteDoc(doc(db, USERS_COLLECTION, participantId));
        
        showMessage('success', `🗑️ Deleted ${participant.fullName} successfully`);
        console.log(`Deleted participant: ${participant.fullName}`);
        
        // Remove from selected if it was selected
        if (selectedParticipants.has(participantId)) {
          const newSelected = new Set(selectedParticipants);
          newSelected.delete(participantId);
          setSelectedParticipants(newSelected);
        }
        
      } catch (error) {
        showMessage('error', `Failed to delete ${participant.fullName}: ${error.message}`);
        console.error('Delete error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // ✅ NEW: Multi-select functions
  const handleSelectParticipant = (participantId, isSelected) => {
    const newSelected = new Set(selectedParticipants);
    if (isSelected) {
      newSelected.add(participantId);
    } else {
      newSelected.delete(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const handleMultiDelete = async () => {
    if (selectedParticipants.size === 0) return;

    const selectedNames = Array.from(selectedParticipants)
      .map(id => participants.find(p => p.id === id)?.fullName)
      .filter(Boolean);

    if (window.confirm(
      `Delete ${selectedParticipants.size} participants?\n\n${selectedNames.join(', ')}\n\nThis action cannot be undone.`
    )) {
      try {
        setLoading(true);
        
        const deletePromises = Array.from(selectedParticipants).map(async (participantId) => {
          try {
            await deleteDoc(doc(db, USERS_COLLECTION, participantId));
            return { id: participantId, success: true };
          } catch (error) {
            return { id: participantId, success: false, error };
          }
        });

        const results = await Promise.all(deletePromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        if (successful > 0) {
          showMessage('success', `🗑️ Successfully deleted ${successful} participants`);
        }
        if (failed > 0) {
          showMessage('error', `Failed to delete ${failed} participants`);
        }

        // Clear selection
        setSelectedParticipants(new Set());
        setIsMultiSelectMode(false);

      } catch (error) {
        showMessage('error', 'Failed to delete participants');
        console.error('Multi-delete error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // ✅ NEW: Filter participants
  const filteredParticipants = participants.filter(participant => {
    switch (participantFilter) {
      case 'active':
        return participant.chantCount > 0;
      case 'inactive':
        return participant.chantCount === 0;
      default:
        return true;
    }
  });

  // Existing event handler functions...
  const handleStartEvent = async () => {
    if (window.confirm('Start the event now? All users will be able to submit chanted rounds.')) {
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
    if (window.confirm('Stop the event? Users will not be able to submit new chanted rounds.')) {
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
    if (window.confirm(
      'Archive current event?\n\n' +
      '• Event history will be saved\n' +
      '• Participant accounts will be preserved\n' +
      '• Chant counts will be reset to 0\n' +
      '• Leaderboard will be cleared\n\n' +
      'Users can participate in future events with the same accounts.'
    )) {
      setLoading(true);
      const result = await archiveCurrentEvent();
      if (result.success) {
        showMessage('success', '📁 Event archived successfully! User accounts preserved, chant counts reset.');
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
          <div className="flex flex-wrap gap-2">
            {['dashboard', 'participants', 'create', 'history'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  currentView === view 
                    ? 'bg-saffron-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {view === 'participants' ? '👥 Participants' : 
                 view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
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

      {/* ✅ NEW: Participants Management View */}
      {currentView === 'participants' && (
        <div className="space-y-6">
          {/* Participant Controls */}
          <div className="card-devotional">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-300">
                👥 Participant Management ({filteredParticipants.length})
              </h3>
              
              {/* Desktop Controls */}
              <div className="flex flex-wrap gap-2">
                {/* Filter Buttons */}
                <div className="flex bg-gray-800 rounded-lg overflow-hidden">
                  {['all', 'active', 'inactive'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setParticipantFilter(filter)}
                      className={`px-3 py-1 text-sm transition-colors ${
                        participantFilter === filter
                          ? 'bg-saffron-500 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {filter === 'all' ? 'All' : 
                       filter === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  ))}
                </div>

                {/* Multi-Select Toggle */}
                <button
                  onClick={() => {
                    setIsMultiSelectMode(!isMultiSelectMode);
                    setSelectedParticipants(new Set());
                  }}
                  className={`px-4 py-1 rounded text-sm transition-colors hidden md:block ${
                    isMultiSelectMode 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {isMultiSelectMode ? 'Cancel Selection' : 'Multi Select'}
                </button>
                
                {/* Multi Delete Button */}
                {isMultiSelectMode && selectedParticipants.size > 0 && (
                  <button
                    onClick={handleMultiDelete}
                    disabled={loading}
                    className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                  >
                    🗑️ Delete Selected ({selectedParticipants.size})
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Instructions */}
            <div className="md:hidden mb-4 p-3 bg-gray-800/50 rounded-lg text-sm text-gray-400">
              📱 <strong>Mobile:</strong> Swipe right to call, swipe left to delete
            </div>

            {/* Participants List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No participants found for "{participantFilter}" filter.</p>
                </div>
              ) : (
                filteredParticipants.map(participant => (
                  <SwipeableParticipantRow
                    key={participant.id}
                    participant={participant}
                    onCall={handleCallParticipant}
                    onDelete={handleDeleteParticipant}
                    isSelected={selectedParticipants.has(participant.id)}
                    onSelect={handleSelectParticipant}
                    showCheckbox={isMultiSelectMode}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing Dashboard, Create, and History views remain the same... */}
      
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
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Collective Count</h3>
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

      {/* Create New Event View - keeping existing code... */}
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

      {/* Events History View - keeping existing code... */}
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
