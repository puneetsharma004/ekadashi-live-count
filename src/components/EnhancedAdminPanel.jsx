import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  db,
  USERS_COLLECTION
} from '../services/firebase';

import { doc, deleteDoc } from 'firebase/firestore';
import { useSwipeable } from 'react-swipeable';

import { 
  IoPlay, 
  IoPause, 
  IoCheckmarkDone, 
  IoArchive,
  IoPersonAdd,
  IoStatsChart,
  IoPeople,
  IoTrophy,
  IoGrid,
  IoCreate,
  IoTime,
  IoSettings,
  IoShieldCheckmark,
  IoCalendar,
  IoText,
  IoPrism,
  IoInformationCircle,
  IoAdd,
  IoCheckmark,
  IoAlert,
  IoCheckboxOutline, 
  IoTrashOutline, 
  IoPhonePortraitOutline,
  IoCallOutline,
  IoPersonOutline 
} from 'react-icons/io5';

import 'react-date-picker/dist/DatePicker.css';
import 'react-time-picker/dist/TimePicker.css';
import 'react-calendar/dist/Calendar.css';

// ✅ OPTIMIZED: Moved constants outside component to prevent re-creation
const VAISHNAVA_EVENTS = [
  { date: '2025-01-13', title: 'Saphala Ekadashi', type: 'ekadashi' },
  { date: '2025-01-29', title: 'Putrada Ekadashi', type: 'ekadashi' },
  { date: '2025-02-12', title: 'Shattila Ekadashi', type: 'ekadashi' },
  { date: '2025-02-27', title: 'Jaya Ekadashi', type: 'ekadashi' },
  { date: '2025-03-03', title: 'Gaura Purnima', type: 'festival' },
  { date: '2025-03-14', title: 'Vijaya Ekadashi', type: 'ekadashi' },
  { date: '2025-03-29', title: 'Amalaki Ekadashi', type: 'ekadashi' },
  { date: '2025-04-13', title: 'Papamochani Ekadashi', type: 'ekadashi' },
  { date: '2025-04-28', title: 'Kamada Ekadashi', type: 'ekadashi' },
  { date: '2025-05-12', title: 'Varuthini Ekadashi', type: 'ekadashi' },
  { date: '2025-05-27', title: 'Mohini Ekadashi', type: 'ekadashi' },
];

const PARTICIPANT_FILTERS = ['all', 'active', 'inactive'];
const NAVIGATION_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: IoGrid },
  { key: 'participants', label: 'Participants', icon: IoPeople },
  { key: 'create', label: 'Create Event', icon: IoCreate },
  { key: 'history', label: 'History', icon: IoTime }
];

// ✅ OPTIMIZED: Memoized SwipeableParticipantRow to prevent unnecessary re-renders
const SwipeableParticipantRow = React.memo(({ 
  participant, 
  onCall, 
  onDelete, 
  isSelected, 
  onSelect, 
  showCheckbox,
  isDeleting = false 
}) => {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isActing, setIsActing] = useState(false);

  // ✅ OPTIMIZED: Memoized mobile detection
  const checkMobile = useCallback(() => {
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobile(isMobileDevice || (isSmallScreen && hasTouchScreen));
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // ✅ OPTIMIZED: Memoized handlers to prevent re-creation
  const handleCheckboxChange = useCallback((e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(participant.id, e.target.checked);
    }
  }, [onSelect, participant.id]);

  const handleAction = useCallback(async () => {
    if (isActing || isDeleting) return;
    
    if ('vibrate' in navigator && isMobile) {
      navigator.vibrate([50, 50, 50]);
    }
    
    setIsActing(true);
    
    try {
      if (swipeDirection === 'call') {
        await onCall(participant);
      } else if (swipeDirection === 'delete') {
        await onDelete(participant.id);
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsActing(false);
      setIsSwipeOpen(false);
      setSwipeDirection(null);
    }
  }, [isActing, isDeleting, isMobile, swipeDirection, onCall, onDelete, participant]);

  const handleMainContentClick = useCallback((e) => {
    if (e.target.closest('.swipe-action-button')) return;
    
    if (isSwipeOpen) {
      setIsSwipeOpen(false);
      setSwipeDirection(null);
    }
  }, [isSwipeOpen]);

  // ✅ OPTIMIZED: Memoized swipe handlers
// 1️⃣ memoise the options object – it’s just data, no Hooks inside
const swipeOptions = useMemo(() => ({
  onSwipedLeft() {
    if (!isMobile) return;
    setSwipeDirection('delete');
    setIsSwipeOpen(true);
    if ('vibrate' in navigator) navigator.vibrate(50);
  },
  onSwipedRight() {
    if (!isMobile) return;
    setSwipeDirection('call');
    setIsSwipeOpen(true);
    if ('vibrate' in navigator) navigator.vibrate(50);
  },
  preventScrollOnSwipe: true,
  trackMouse: false,
  delta: 50,
  velocityThreshold: 0.2,
  touchEventOptions: { passive: false },
}), [isMobile]);

// 2️⃣ now call the hook at top level
const handlers = useSwipeable(swipeOptions);


  // ✅ OPTIMIZED: Memoized computed values
  const lastUpdatedTime = useMemo(() => {
    if (!participant.lastUpdated) return null;
    return new Date(participant.lastUpdated.toDate()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [participant.lastUpdated]);

  const totalNames = useMemo(() => {
    return (participant.chantCount * 1728).toLocaleString();
  }, [participant.chantCount]);

  if (isDeleting) {
    return (
      <div className="relative overflow-hidden bg-gray-800/30 rounded-lg shadow-sm border border-gray-600/30 mb-2 opacity-50">
        <div className="flex items-center p-4">
          <div className="spinner mr-3"></div>
          <div className="text-gray-400">Deleting {participant.fullName || participant.name}...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      {...handlers}
      className="relative overflow-hidden bg-gray-800/50 rounded-lg shadow-sm border border-gray-600/50 mb-2"
    >
      <div 
        className={`flex items-center p-4 transition-transform duration-200 ${
          isSwipeOpen 
            ? swipeDirection === 'call' 
              ? 'transform translate-x-16' 
              : 'transform -translate-x-16'
            : ''
        }`}
        onClick={handleMainContentClick}
      >
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="mr-3 hidden md:block w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h4 className="font-medium text-white truncate">
              {participant.fullName || participant.name}
            </h4>
            {participant.role === 'DEVOTEE' && (
              <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded">
                Devotee
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{participant.phone}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{participant.chantCount} rounds</span>
            <span>{totalNames} names</span>
            {lastUpdatedTime && (
              <span>Active: {lastUpdatedTime}</span>
            )}
          </div>
        </div>
        
        <div className="hidden md:flex space-x-2 flex-shrink-0">
          <button
            onClick={() => onCall(participant)}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center gap-1"
            title="Call Participant"
          >
            <IoCallOutline className="text-lg" />
          </button>
          <button
            onClick={() => onDelete(participant.id)}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors flex items-center gap-1"
            title="Delete Participant"
          >
            <IoTrashOutline className="text-lg" />
          </button>
        </div>
      </div>

      {isSwipeOpen && (
        <>
          {swipeDirection === 'call' && (
            <div 
              className="absolute left-0 top-0 h-full w-16 bg-green-600 flex items-center justify-center cursor-pointer md:hidden z-10 swipe-action-button"
              onClick={handleAction}
            >
              <IoCallOutline className="text-white text-2xl" />
            </div>
          )}
          
          {swipeDirection === 'delete' && (
            <div 
              className="absolute right-0 top-0 h-full w-16 bg-red-600 flex items-center justify-center cursor-pointer md:hidden z-10 swipe-action-button"
              onClick={handleAction}
            >
              <IoTrashOutline className="text-white text-2xl" />
            </div>
          )}
        </>
      )}
    </div>
  );
});

SwipeableParticipantRow.displayName = 'SwipeableParticipantRow';

// ✅ OPTIMIZED: Memoized Navigation Component
const NavigationTabs = React.memo(({ currentView, onViewChange }) => (
  <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center sm:justify-start gap-2 sm:gap-2 mb-6">
    {NAVIGATION_ITEMS.map((item) => {
      const IconComponent = item.icon;
      const isActive = currentView === item.key;
      
      return (
        <button
          key={item.key}
          onClick={() => onViewChange(item.key)}
          className={`flex items-center justify-center sm:justify-start space-x-2 p-3 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[80px] sm:min-h-0 flex-col sm:flex-row space-y-1 sm:space-y-0 ${
            isActive 
              ? 'bg-saffron-500 text-white shadow-lg sm:transform sm:scale-105' 
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
          }`}
        >
          <IconComponent className="text-xl sm:text-lg" />
          <span className="text-xs sm:text-sm text-center sm:text-left leading-tight">{item.label}</span>
        </button>
      );
    })}
  </div>
));

NavigationTabs.displayName = 'NavigationTabs';

// ✅ OPTIMIZED: Main Component with performance improvements
const EnhancedAdminPanel = ({ eventSettings }) => {
  const { user } = useAuth();
  const [globalCount, setGlobalCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [eventsHistory, setEventsHistory] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Participant management state
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [participantFilter, setParticipantFilter] = useState('all');
  const [deletingIds, setDeletingIds] = useState(new Set());

  // ✅ OPTIMIZED: Proper initial state with default date
  const [newEventForm, setNewEventForm] = useState({
    eventName: '',
    eventDate: new Date(),
    globalGoal: 666,
    startTime: '06:00',
    endTime: '23:59',
    description: ''
  });

  // ✅ OPTIMIZED: Memoized computed values
  const activeParticipants = useMemo(() => 
    participants.filter(p => p.chantCount > 0), 
    [participants]
  );

  const progressPercentage = useMemo(() => 
    eventSettings?.globalGoal ? 
      ((globalCount / eventSettings.globalGoal) * 100).toFixed(1) : 0,
    [globalCount, eventSettings?.globalGoal]
  );

  const eventStatus = useMemo(() => 
    eventSettings?.eventActive ? 'Active' :
    eventSettings?.status === 'completed' ? 'Completed' : 'Stopped',
    [eventSettings?.eventActive, eventSettings?.status]
  );

  const filteredParticipants = useMemo(() => 
    participants.filter(participant => {
      switch (participantFilter) {
        case 'active': return participant.chantCount > 0;
        case 'inactive': return participant.chantCount === 0;
        default: return true;
      }
    }),
    [participants, participantFilter]
  );

  // ✅ OPTIMIZED: Debounced message clearing
  const messageTimeoutRef = useRef();
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    
    messageTimeoutRef.current = setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  }, []);

  // ✅ OPTIMIZED: Memoized event handlers
  const handleCallParticipant = useCallback((participant) => {
    try {
      let cleanNumber = participant.phone.replace(/[^\d+]/g, '');
      
      if (cleanNumber.startsWith('+91')) {
        window.open(`tel:${cleanNumber}`);
      } else if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
        window.open(`tel:+${cleanNumber}`);
      } else if (cleanNumber.length === 10) {
        window.open(`tel:+91${cleanNumber}`);
      } else {
        console.warn('Unusual phone number format:', participant.phone);
        window.open(`tel:${cleanNumber}`);
      }
      
      showMessage('success', `📞 Calling ${participant.fullName || participant.name}`);
    } catch (error) {
      console.error('Call error:', error);
      showMessage('error', 'Failed to initiate call');
    }
  }, [showMessage]);

  const handleDeleteParticipant = useCallback(async (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    if (window.confirm(`Delete "${participant.fullName || participant.name}"?\n\nThis cannot be undone.`)) {
      try {
        setDeletingIds(prev => new Set([...prev, participantId]));
        
        await deleteDoc(doc(db, USERS_COLLECTION, participantId));
        
        showMessage('success', `🗑️ Deleted ${participant.fullName || participant.name}`);
        
        setSelectedParticipants(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(participantId);
          return newSelected;
        });
        
      } catch (error) {
        console.error('Delete error:', error);
        showMessage('error', `Failed to delete ${participant.fullName || participant.name}`);
      } finally {
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(participantId);
          return newSet;
        });
      }
    }
  }, [participants, showMessage]);

  const handleSelectParticipant = useCallback((participantId, isSelected) => {
    setSelectedParticipants(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(participantId);
      } else {
        newSelected.delete(participantId);
      }
      return newSelected;
    });
  }, []);

  const handleMultiDelete = useCallback(async () => {
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

        setSelectedParticipants(new Set());
        setIsMultiSelectMode(false);

      } catch (error) {
        showMessage('error', 'Failed to delete participants');
        console.error('Multi-delete error:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedParticipants, participants, showMessage]);

  // ✅ OPTIMIZED: Memoized form handlers
  const handleStartEvent = useCallback(async () => {
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
  }, [showMessage]);

  const handleStopEvent = useCallback(async () => {
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
  }, [showMessage]);

  const handleCompleteEvent = useCallback(async () => {
    if (window.confirm('Complete this event? This will finalize all stats and save to history.')) {
      setLoading(true);
      const result = await completeEvent();
      if (result.success) {
        await loadEventsHistory();
        showMessage('success', '✅ Event completed and saved to history!');
      } else {
        showMessage('error', `Failed to complete event: ${result.error}`);
      }
      setLoading(false);
    }
  }, [showMessage]);

  const handleArchiveCurrentEvent = useCallback(async () => {
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
  }, [showMessage]);

  const handleCreateNewEvent = useCallback(async (e) => {
    e.preventDefault();
    
    if (window.confirm('Create new event? This will archive the current event and clear all participant data.')) {
      setLoading(true);
      
      const startHour = newEventForm.startTime ? parseInt(newEventForm.startTime.split(':')[0]) : 6;
      const endHour = newEventForm.endTime ? parseInt(newEventForm.endTime.split(':')) : 24;
      
      const eventData = {
        ...newEventForm,
        startTime: startHour,
        endTime: endHour
      };
      
      const result = await createNewEvent(eventData);
      if (result.success) {
        showMessage('success', '🎊 New event created successfully!');
        setCurrentView('dashboard');
        setNewEventForm({
          eventName: '',
          eventDate: new Date(),
          globalGoal: 666,
          startTime: '06:00',
          endTime: '23:59',
          description: ''
        });
        loadEventsHistory();
      } else {
        showMessage('error', `Failed to create event: ${result.error}`);
      }
      setLoading(false);
    }
  }, [newEventForm, showMessage]);

  // ✅ OPTIMIZED: Memoized load function
  const loadEventsHistory = useCallback(async () => {
    const result = await getEventsHistory(5);
    if (result.success) {
      setEventsHistory(result.events);
    }
  }, []);

  // ✅ OPTIMIZED: Effect cleanup
  useEffect(() => {
    const unsubscribeCount = subscribeToGlobalCount(setGlobalCount);
    const unsubscribeLeaderboard = subscribeToLeaderboard(setParticipants);

    loadEventsHistory();

    return () => {
      unsubscribeCount();
      unsubscribeLeaderboard();
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [loadEventsHistory]);

  return (
    <div className="space-y-6">
      {/* Premium Admin Header */}
      <div className="card-devotional bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <IoSettings className="text-2xl text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-400">
                Advanced Event Manager
              </h2>
              <p className="text-sm text-gray-400">Complete event control & analytics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
            <IoShieldCheckmark className="text-lg text-red-400" />
            <span className="text-sm font-medium text-red-300">Admin Access</span>
            {DEV_MODE && (
              <span className="ml-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                DEV
              </span>
            )}
          </div>
        </div>
        
        <NavigationTabs currentView={currentView} onViewChange={setCurrentView} />
        
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300">Welcome, <strong className="text-white">{user?.fullName}</strong></span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Current Event:</span>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold ${
                  eventStatus === 'Active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  eventStatus === 'Completed' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    eventStatus === 'Active' ? 'bg-green-400' :
                    eventStatus === 'Completed' ? 'bg-blue-400' : 'bg-red-400'
                  }`}></div>
                  <span>{eventStatus}</span>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <IoPeople className="text-blue-400" />
                  <span>{participants.length} users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <IoTrophy className="text-saffron-400" />
                  <span>{activeParticipants.length} active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Participants Management View */}
      {currentView === 'participants' && (
        <div className="space-y-6">
          <div className="card-devotional">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                <IoPeople className="text-saffron-500" />
                Participant Management ({filteredParticipants.length})
              </h3>
              
              <div className="flex flex-wrap gap-2">
                <div className="flex bg-gray-800 rounded-lg overflow-hidden">
                  {PARTICIPANT_FILTERS.map((filter) => (
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

                <button
                  onClick={() => {
                    setIsMultiSelectMode(!isMultiSelectMode);
                    setSelectedParticipants(new Set());
                  }}
                  className={`px-4 py-1 rounded text-sm transition-colors hidden md:flex items-center gap-2 ${
                    isMultiSelectMode 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <IoCheckboxOutline />
                  {isMultiSelectMode ? 'Cancel Selection' : 'Multi Select'}
                </button>
                
                {isMultiSelectMode && selectedParticipants.size > 0 && (
                  <button
                    onClick={handleMultiDelete}
                    disabled={loading}
                    className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <IoTrashOutline />
                    Delete Selected ({selectedParticipants.size})
                  </button>
                )}
              </div>
            </div>

            <div className="md:hidden mb-4 p-3 bg-gray-800/50 rounded-lg text-sm text-gray-400 flex items-center gap-2">
              <IoPhonePortraitOutline />
              <strong>Mobile:</strong> Swipe right to call, swipe left to delete
            </div>

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
                    isDeleting={deletingIds.has(participant.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-devotional bg-gradient-to-r from-green-900/10 to-blue-900/10 border-green-500/20">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-300 mb-1">Event Control</h4>
                <p className="text-sm text-gray-400">Start and stop event submissions</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleStartEvent}
                  disabled={loading || eventSettings?.eventActive}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 w-full"
                >
                  <IoPlay className="text-lg" />
                  <span>{eventSettings?.eventActive ? 'Event Active' : 'Start Event'}</span>
                </button>
                
                <button
                  onClick={handleStopEvent}
                  disabled={loading || !eventSettings?.eventActive}
                  className="flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 w-full"
                >
                  <IoPause className="text-lg" />
                  <span>{eventSettings?.eventActive ? 'Stop Event' : 'Event Stopped'}</span>
                </button>
              </div>
            </div>

            <div className="card-devotional bg-gradient-to-r from-purple-900/10 to-indigo-900/10 border-purple-500/20">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-300 mb-1">Event Lifecycle</h4>
                <p className="text-sm text-gray-400">Finalize and manage event data</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCompleteEvent}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 w-full"
                >
                  <IoCheckmarkDone className="text-lg" />
                  <span>Complete Event</span>
                </button>
                
                <button
                  onClick={handleArchiveCurrentEvent}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 w-full"
                >
                  <IoArchive className="text-lg" />
                  <span>Archive Event</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-devotional text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <IoStatsChart className="text-xl text-saffron-400" />
                <h3 className="text-lg font-semibold text-gray-300">Collective Count</h3>
              </div>
              <div className="text-3xl font-bold text-saffron-400">{globalCount}</div>
              <div className="text-sm text-gray-400">of {eventSettings?.globalGoal || 666}</div>
            </div>
            
            <div className="card-devotional text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <IoTrophy className="text-xl text-devotional-gold" />
                <h3 className="text-lg font-semibold text-gray-300">Progress</h3>
              </div>
              <div className="text-3xl font-bold text-devotional-gold">{progressPercentage}%</div>
            </div>
            
            <div className="card-devotional text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <IoPeople className="text-xl text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-300">Total Users</h3>
              </div>
              <div className="text-3xl font-bold text-blue-400">{participants.length}</div>
            </div>
            
            <div className="card-devotional text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <IoPersonAdd className="text-xl text-green-400" />
                <h3 className="text-lg font-semibold text-gray-300">Active</h3>
              </div>
              <div className="text-3xl font-bold text-green-400">{activeParticipants.length}</div>
            </div>
          </div>

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

      {/* Create New Event Form */}
      {currentView === 'create' && (
        <div className="space-y-6">
          <div className="card-devotional bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border-blue-500/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <IoCreate className="text-2xl text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-300">Create New Event</h3>
                <p className="text-sm text-gray-400">Set up a new Ekadashi chanting event</p>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <IoCalendar className="text-lg text-saffron-400" />
                <h4 className="text-sm font-semibold text-gray-300">Upcoming Ekadashi Dates</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {VAISHNAVA_EVENTS.slice(0, 6).map((event) => (
                  <div
                    key={event.date}
                    onClick={() => {
                      const eventDate = new Date(event.date);
                      setNewEventForm(prev => ({
                        ...prev,
                        eventDate: eventDate,
                        eventName: event.title
                      }));
                    }}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      event.type === 'ekadashi' 
                        ? 'bg-saffron-500/10 hover:bg-saffron-500/20 border border-saffron-500/20' 
                        : 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20'
                    }`}
                  >
                    <div className="font-medium text-gray-300">{event.title}</div>
                    <div className="text-gray-400">{new Date(event.date).toLocaleDateString('en-IN')}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <IoInformationCircle className="inline mr-1" />
                Click on any date to auto-fill the form
              </p>
            </div>
          </div>

          <div className="card-devotional">
            <form onSubmit={handleCreateNewEvent} className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <IoText className="text-lg text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-300">Event Details</h4>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                      <IoText className="text-sm" />
                      <span>Event Name</span>
                    </label>
                    <input
                      type="text"
                      value={newEventForm.eventName}
                      onChange={(e) => setNewEventForm(prev => ({...prev, eventName: e.target.value}))}
                      placeholder="e.g., Saphala Ekadashi Chanting Marathon"
                      className="input-devotional"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                      <IoPrism className="text-sm" />
                      <span>Target Rounds</span>
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
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <IoCalendar className="text-lg text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-300">Date & Time</h4>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                      <IoCalendar className="text-sm" />
                      <span>Event Date</span>
                    </label>
                    <input
                      type="date"
                      value={newEventForm.eventDate ? newEventForm.eventDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setNewEventForm(prev => ({
                        ...prev, 
                        eventDate: e.target.value ? new Date(e.target.value) : null
                      }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/20 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                      <IoTime className="text-sm" />
                      <span>Start Time</span>
                    </label>
                    <input
                      type="time"
                      value={newEventForm.startTime}
                      onChange={(e) => setNewEventForm(prev => ({...prev, startTime: e.target.value}))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/20 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                      <IoTime className="text-sm" />
                      <span>End Time</span>
                    </label>
                    <input
                      type="time"
                      value={newEventForm.endTime}
                      onChange={(e) => setNewEventForm(prev => ({...prev, endTime: e.target.value}))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/20 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <IoInformationCircle className="text-lg text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-300">Event Description</h4>
                </div>
                
                <textarea
                  value={newEventForm.description}
                  onChange={(e) => setNewEventForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe the event purpose, special instructions, fasting guidelines, etc."
                  rows="4"
                  className="input-devotional resize-none w-full"
                />
              </div>

              <div className="border-t border-gray-700/50 pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('dashboard');
                      setNewEventForm({
                        eventName: '',
                        eventDate: new Date(),
                        globalGoal: 666,
                        startTime: '06:00',
                        endTime: '23:59',
                        description: ''
                      });
                    }}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <IoAlert className="text-lg" />
                    <span>Cancel</span>
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-saffron-600 hover:bg-saffron-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="spinner mr-2"></div>
                        <span>Creating New Event...</span>
                      </>
                    ) : (
                      <>
                        <IoAdd className="text-lg" />
                        <span>Create New Event</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
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
