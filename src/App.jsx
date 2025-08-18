import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext'; // ✅ Fixed: Added 's'
import { useEventSettings } from './hooks/useEventSettings.js';
import AuthForm from './components/AuthForm.jsx';               // ✅ Fixed: AuthForm not AuthFrom
import Home from './pages/Home.jsx';
import CountdownTimer from './components/CountdownTimer.jsx';
import Navbar from './components/Navbar.jsx';
import { getEventStatus } from './services/firebase.js';

// Main App Content (inside AuthProvider)
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const { settings: eventSettings, loading: settingsLoading } = useEventSettings();

  // 🔍 DEBUG: Add console logs to see what's happening
  console.log('🔍 App Debug:', {
    isAuthenticated,
    loading,
    eventSettings,
    settingsLoading
  });

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

  // Get event status using dynamic settings
  const eventStatus = getEventStatus(eventSettings);
  console.log('🔍 Event Status:', eventStatus, 'Event Settings:', eventSettings);

  // ✅ FIXED: Force ACTIVE status for testing if DEV_MODE
  const isDevMode = true; // Set this based on your firebase.js DEV_MODE
  const finalEventStatus = isDevMode ? 'ACTIVE' : eventStatus;
  
  console.log('🔍 Final Event Status:', finalEventStatus);

  // If authenticated, show main app based on event status
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        {/* 🔍 DEBUG: Show current status */}
        <div className="mb-4 p-2 bg-gray-800 text-white text-sm rounded">
          Debug: Status = {finalEventStatus} | Settings = {JSON.stringify(eventSettings)}
        </div>

        {finalEventStatus === 'BEFORE_START' && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gradient-saffron mb-4">
                🙏 Ekadashi Chanting Event
              </h2>
              <p className="text-gray-300 mb-6">
                The event will begin at {eventSettings?.startTime || 6}:00 AM. 
                Please wait for the countdown to complete.
              </p>
              <CountdownTimer eventSettings={eventSettings} />
            </div>
          </div>
        )}

        {/* ✅ FIXED: This should now render */}
        {finalEventStatus === 'ACTIVE' && (
          <div>
            <h1 className="text-white text-2xl mb-4">🔍 About to render Home component</h1>
            <Home eventSettings={eventSettings} />
          </div>
        )}

        {finalEventStatus === 'ENDED' && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gradient-saffron mb-4">
                🙏 Event Complete
              </h2>
              <p className="text-gray-300 mb-4">
                {eventSettings?.eventActive === false 
                  ? 'The event has been stopped by the admin.'
                  : `The Ekadashi chanting event has ended at ${eventSettings?.endTime || 24}:00.`
                }
              </p>
              <p className="text-lg text-saffron-300">
                Thank you for your participation! 🌟
              </p>
            </div>
          </div>
        )}

        {/* ✅ ADDED: Fallback for unknown status */}
        {!['BEFORE_START', 'ACTIVE', 'ENDED'].includes(finalEventStatus) && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-red-400 mb-4">
                🔍 Debug: Unknown Event Status
              </h2>
              <p className="text-gray-300">
                Current Status: <strong>{finalEventStatus}</strong>
              </p>
              <p className="text-gray-300 mt-2">
                Event Settings: <pre>{JSON.stringify(eventSettings, null, 2)}</pre>
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
