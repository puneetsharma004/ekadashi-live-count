import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToGlobalCount, isAdmin, subscribeToUserChantCount } from '../services/firebase.js';
import { useEventSettings } from '../hooks/useEventSettings';
import EnhancedAdminPanel from '../components/EnhancedAdminPanel';
import MobileBottomNav from '../components/MobileBottomNav';

// Import section components
import EventSection from '../components/sections/EventSection';
import JapaSection from '../components/sections/JapaSection';
import LeaderboardSection from '../components/sections/LeaderboardSection';
// import useHapticOnChange from '../hooks/useHapticOnChange.js';

const Home = ({ eventSettings: propEventSettings }) => {
  
  const { user } = useAuth();
  const [globalCount, setGlobalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [userChantCount, setUserChantCount] = useState(user?.chantCount || 0);
  
  // ✅ NEW: Navigation state
  const [activeSection, setActiveSection] = useState('event');
  
  const { settings: hookEventSettings, loading: settingsLoading } = useEventSettings();
  const eventSettings = propEventSettings || hookEventSettings;

  const userIsAdmin = user && isAdmin(user.phone);





  useEffect(() => {
    const unsubscribe = subscribeToGlobalCount((totalCount) => {
      setGlobalCount(totalCount);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeUser = subscribeToUserChantCount(user.id, (chantCount) => {
      console.log('🔄 User chant count updated:', chantCount);
      setUserChantCount(chantCount);
    });

    return () => unsubscribeUser();
  }, [user?.id]);

  const globalGoal = eventSettings?.globalGoal || 666;
  const progressPercentage = (globalCount / globalGoal) * 100;
  const isOverAchieved = progressPercentage > 100;

  //   /* ---------- generic tick for every increment ---------- */
  // useHapticOnChange(globalCount, 35, 3000); // 3-second minimum gap
  //      // 35 ms default pulse

  // /* ---------- milestone buzz (first time goal is reached) ---------- */
  // const milestonePattern = [40, 30, 40];   // double-tap
  // const prevCountRef = useRef(globalCount);

  // const crossedGoal =
  //   globalCount > 0 &&
  //   prevCountRef.current < globalGoal &&    // was below
  //   globalCount >= globalGoal;              // now at/above

  // useHapticOnChange(crossedGoal ? globalCount : null, milestonePattern);

  // /* keep prevCount in sync for next render */
  // useEffect(() => {
  //   prevCountRef.current = globalCount;
  // }, [globalCount]);

  if (settingsLoading && !propEventSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 text-saffron-500"></div>
          <p className="text-gray-300">Loading event settings...</p>
        </div>
      </div>
    );
  }

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
        <EnhancedAdminPanel eventSettings={eventSettings} />
      </div>
    );
  }

  // ✅ DESKTOP: Show all sections (current layout)
  const renderDesktopLayout = () => (
    <div className="space-y-8 hidden md:block">
      <EventSection 
        user={user}
        eventSettings={eventSettings}
        globalCount={globalCount}
        globalGoal={globalGoal}
        loading={loading}
        progressPercentage={progressPercentage}
        isOverAchieved={isOverAchieved}
        userIsAdmin={userIsAdmin}
        setShowAdmin={setShowAdmin}
      />
      
      <div className="card-devotional">
        <JapaSection 
          user={user}
          eventSettings={eventSettings}
          userChantCount={userChantCount}
          globalCount={globalCount}        // ❌ Missing
          globalGoal={globalGoal}          // ❌ Missing
          progressPercentage={progressPercentage} // ❌ Missing
        />
      </div>
      
      <div className="card-devotional">
        <LeaderboardSection />
      </div>
    </div>
  );

  // ✅ MOBILE: Show active section only
  const renderMobileLayout = () => (
    <div className="md:hidden pb-20"> {/* pb-20 for bottom nav space */}
      {activeSection === 'event' && (
        <EventSection 
          user={user}
          eventSettings={eventSettings}
          globalCount={globalCount}
          globalGoal={globalGoal}
          loading={loading}
          progressPercentage={progressPercentage}
          isOverAchieved={isOverAchieved}
          userIsAdmin={userIsAdmin}
          setShowAdmin={setShowAdmin}
        />
      )}
      
      {activeSection === 'japa' && (
        <JapaSection 
          user={user}
          eventSettings={eventSettings}
          userChantCount={userChantCount}
          globalCount={globalCount}        // ❌ Missing
          globalGoal={globalGoal}          // ❌ Missing
          progressPercentage={progressPercentage} // ❌ Missing
        />
      )}
      
      {activeSection === 'leaderboard' && (
        <LeaderboardSection />
      )}
    </div>
  );

  return (
    <div>
      {/* Desktop Layout */}
      {renderDesktopLayout()}
      
      {/* Mobile Layout */}
      {renderMobileLayout()}
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
    </div>
  );
};

export default Home;
