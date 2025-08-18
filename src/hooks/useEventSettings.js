import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

// Default values (fallback when Firebase document doesn't exist)
const DEFAULT_SETTINGS = {
  startTime: 6,     // 6:00 AM
  endTime: 24,      // Midnight
  globalGoal: 666,  // Default goal
  eventActive: false // Admin can start/stop event manually
};

export const useEventSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, 'eventSettings', 'current');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            startTime: data.startTime || DEFAULT_SETTINGS.startTime,
            endTime: data.endTime || DEFAULT_SETTINGS.endTime,
            globalGoal: data.globalGoal || DEFAULT_SETTINGS.globalGoal,
            eventActive: data.eventActive !== undefined ? data.eventActive : DEFAULT_SETTINGS.eventActive,
            eventName: data.eventName || '',
            description: data.description || '',
            status: data.status || 'created'
          });
        } else {
          // Document doesn't exist, use defaults
          setSettings(DEFAULT_SETTINGS);
        }
        setError(null);
      } catch (err) {
        console.error('Error reading event settings:', err);
        setError(err.message);
        setSettings(DEFAULT_SETTINGS); // Use defaults on error
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Error listening to event settings:', err);
      setError(err.message);
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading, error };
};
