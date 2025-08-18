import React from 'react';
import AuthForm from './components/AuthFrom';
import Navbar from './components/Navbar';
import CountdownTimer from './components/CountdownTimer';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import { getEventStatus } from './services/firebase';



// Main App Content (inside AuthProvider)
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const eventStatus = getEventStatus();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 text-saffron-500"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login/register form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  // If authenticated, show main app based on event status
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        {eventStatus === 'BEFORE_START' && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gradient-saffron mb-4">
                🙏 Ekadashi Chanting Event
              </h2>
              <p className="text-gray-300 mb-6">
                The event will begin at 6:00 AM. Please wait for the countdown to complete.
              </p>
              <CountdownTimer />
            </div>
          </div>
        )}

        {eventStatus === 'ACTIVE' && <Home />}

        {eventStatus === 'ENDED' && (
          <div className="text-center">
            <div className="card-devotional max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gradient-saffron mb-4">
                🙏 Event Complete
              </h2>
              <p className="text-gray-300 mb-4">
                The Ekadashi chanting event has ended at midnight.
              </p>
              <p className="text-lg text-saffron-300">
                Thank you for your participation! 🌟
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
