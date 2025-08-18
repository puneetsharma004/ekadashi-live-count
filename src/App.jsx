import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext'; // ✅ Fixed: Added 's'
import { useEventSettings } from './hooks/useEventSettings.js';
import AuthForm from './components/AuthForm.jsx';
import Home from './pages/Home.jsx';
import CountdownTimer from './components/CountdownTimer.jsx';
import Navbar from './components/Navbar.jsx';
import { getEventStatus } from './services/firebase.js';

// Main App Content (inside AuthProvider)
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const { settings: eventSettings, loading: settingsLoading } = useEventSettings();

  // 🔍 DEBUG: Add console logs to see what's happening
  // console.log('🔍 App Debug:', {
  //   isAuthenticated,
  //   loading,
  //   eventSettings,
  //   settingsLoading
  // });

  // ✅ FIXED: Add timeout for loading states to prevent infinite loading
  const [debugTimeout, setDebugTimeout] = React.useState(false);
  
  React.useEffect(() => {
    // If loading takes more than 10 seconds, something is wrong
    const timer = setTimeout(() => {
      console.log('⚠️ Loading timeout - forcing continue');
      setDebugTimeout(true);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen while checking authentication or settings
  // ✅ FIXED: Add timeout escape hatch
  if ((loading || settingsLoading) && !debugTimeout) {
    console.log('🔍 Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 text-saffron-500"></div>
          <p className="text-gray-300">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">
            Auth: {loading ? 'Loading...' : 'Ready'} | 
            Settings: {settingsLoading ? 'Loading...' : 'Ready'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login/register form
  if (!isAuthenticated) {
    console.log('🔍 Showing auth form');
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  // ✅ FIXED: Get actual event status (no dev mode override)
  const eventStatus = getEventStatus(eventSettings);
  console.log('🔍 Event Status:', eventStatus, 'Event Settings:', eventSettings);

  // If authenticated, show main app based on event status
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        {/* 🔍 DEBUG: Show current status (uncomment for debugging) */}
        <div className="mb-4 p-2 bg-gray-800 text-white text-sm rounded">
          Debug: Status = {eventStatus} | Event Active = {eventSettings?.eventActive ? 'Yes' : 'No'} | Event Status = {eventSettings?.status}
        </div>

        {/* ✅ FIXED: Show countdown for BEFORE_START status */}
        {eventStatus === 'BEFORE_START' && (
          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              {/* ✅ Enhanced countdown with better spacing and design */}
              <CountdownTimer 
                eventSettings={eventSettings}
                onComplete={() => {
                  console.log('🎉 Countdown complete! Event starting...');
                  // Show a brief "Event Starting" message before refresh
                  setTimeout(() => {
                    window.location.reload(); // Force refresh when countdown ends
                  }, 2000); // 2 second delay to show the "Event Started" message
                }}
              />
              
              {/* ✅ Additional helpful information */}
              <div className="mt-8 space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <h4 className="text-lg font-semibold text-gray-300 mb-3">🙏 How to Prepare</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📿</div>
                      <p className="font-medium text-gray-300">Get Your Beads</p>
                      <p>Prepare your chanting beads for the spiritual journey</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">🧘</div>
                      <p className="font-medium text-gray-300">Find Peace</p>
                      <p>Choose a quiet, peaceful space for chanting</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">💫</div>
                      <p className="font-medium text-gray-300">Set Intention</p>
                      <p>Focus your mind and set a spiritual intention</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ FIXED: Show Home component for ACTIVE status */}
        {eventStatus === 'ACTIVE' && (
          <div>
            {/* ✅ Event Started Animation */}
            <div className="mb-6 text-center animate-fade-in">
              <div className="bg-gradient-to-r from-green-500/20 to-saffron-500/20 rounded-lg p-4 border border-green-500/50">
                <h2 className="text-2xl font-bold text-green-400 mb-2">
                  🎉 Event Started!
                </h2>
                <p className="text-gray-300">
                  You can now submit your chant rounds. Good luck! 🙏
                </p>
              </div>
            </div>
            <Home eventSettings={eventSettings} />
          </div>
        )}

        {/* ✅ Show paused/stopped events */}
        {eventStatus === 'STOPPED' && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-red-400 mb-4">
                ⏸️ Event Paused by Admin
              </h2>
              <p className="text-gray-300 mb-4">
                The running event has been temporarily paused by the admin.
              </p>
              <p className="text-gray-400">
                Please wait for the admin to resume the event.
              </p>
            </div>
          </div>
        )}

        {/* ✅ Show completed events */}
        {eventStatus === 'COMPLETED' && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                🎊 Event Successfully Completed!
              </h2>
              <p className="text-gray-300 mb-4">
                The Ekadashi chanting event has been completed by the admin.
              </p>
              <p className="text-lg text-saffron-300">
                Thank you for your participation! 🌟
              </p>
              <p className="text-gray-400 text-sm mt-4">
                Your account is preserved for future events.
              </p>
            </div>
          </div>
        )}

        {/* ✅ Show ended events */}
        {eventStatus === 'ENDED' && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-400 mb-4">
                🌙 Event Time Ended
              </h2>
              <p className="text-gray-300 mb-4">
                The event time ({eventSettings?.startTime}:00 - {eventSettings?.endTime}:00) has ended.
              </p>
              <p className="text-gray-400">
                Wait for the next event or contact admin.
              </p>
            </div>
          </div>
        )}

        {/* ✅ Show no event message */}
        {eventStatus === 'NO_EVENT' && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-400 mb-4">
                📅 No Active Event
              </h2>
              <p className="text-gray-300">
                There is currently no event scheduled. Please wait for an admin to create a new event.
              </p>
            </div>
          </div>
        )}

        {/* ✅ ADDED: Fallback for unknown status */}
        {!['BEFORE_START', 'ACTIVE', 'STOPPED', 'COMPLETED', 'ENDED', 'NO_EVENT'].includes(eventStatus) && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-red-400 mb-4">
                🔍 Debug: Unknown Event Status
              </h2>
              <p className="text-gray-300">
                Current Status: <strong>{eventStatus}</strong>
              </p>
              <p className="text-gray-300 mt-2">
                Event Settings: <pre className="text-xs">{JSON.stringify(eventSettings, null, 2)}</pre>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Root App Component
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
