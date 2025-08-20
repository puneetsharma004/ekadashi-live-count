// Firebase configuration and services
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  onSnapshot,
  orderBy,
  increment,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp, 
  limit
} from 'firebase/firestore';

// Add this import at the top with other imports
import { USER_ROLES } from '../constants/roles';


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDRthSJrs6gJlZpmnU03kS8ZPynqfYILcc",
  authDomain: "ekadashi-live-count.firebaseapp.com",
  projectId: "ekadashi-live-count",
  storageBucket: "ekadashi-live-count.firebasestorage.app",
  messagingSenderId: "428089112671",
  appId: "1:428089112671:web:0e89c2c00c0e0641fd03ea",
  measurementId: "G-JH9GHD0CBX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Development mode - set to true for testing
export const DEV_MODE = false;

// Admin credentials - change these!
export const ADMIN_PHONE = "7483916205";
export const ADMIN_PASSWORD = "t9X@7fQ1Lp";

// Collection references
export const USERS_COLLECTION = 'users';
export const EVENT_SETTINGS_COLLECTION = 'eventSettings';
export const EVENTS_HISTORY_COLLECTION = 'eventsHistory';


// ===== EVENT MANAGEMENT FUNCTIONS =====

// Get current active event
export const getCurrentEvent = async () => {
  try {
    const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
    const docSnap = await getDoc(settingsRef);
    
    if (docSnap.exists()) {
      return { success: true, event: docSnap.data() };
    }
    return { success: false, error: 'No active event found' };
  } catch (error) {
    console.error('Error getting current event:', error);
    return { success: false, error: error.message };
  }
};

// Create new event
export const createNewEvent = async (eventData) => {
  try {
    // Archive current event first
    await archiveCurrentEvent();
    
    // Create new event
    const newEventData = {
      ...eventData,
      eventActive: false, // Start as inactive
      createdAt: serverTimestamp(),
      createdBy: 'admin',
      status: 'created', // created, active, paused, completed, archived
      totalParticipants: 0,
      totalRounds: 0
    };
    
    const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
    await setDoc(settingsRef, newEventData);
    
    return { success: true, eventId: 'current' };
  } catch (error) {
    console.error('Error creating new event:', error);
    return { success: false, error: error.message };
  }
};

// ✅ ENHANCED: Manual start event (with override tracking)
export const startEvent = async () => {
  try {
    const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
    await updateDoc(settingsRef, {
      eventActive: true,
      status: 'active',
      manuallyStartedAt: serverTimestamp(), // ✅ Track manual override
      startedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error starting event:', error);
    return { success: false, error: error.message };
  }
};

// ✅ ENHANCED: Manual stop event (with override tracking)
export const stopEvent = async () => {
  try {
    const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
    await updateDoc(settingsRef, {
      eventActive: false,
      status: 'paused',
      manuallyPausedAt: serverTimestamp(), // ✅ Track manual override
      pausedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error stopping event:', error);
    return { success: false, error: error.message };
  }
};

// ✅ ENHANCED: Manual complete event (with override tracking)
export const completeEvent = async () => {
  try {
    // Get current stats
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    let globalCount = 0;
    const participants = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      globalCount += data.chantCount || 0;
      participants.push({ id: doc.id, ...data });
    });
    
    // Get current event settings
    const currentEventResult = await getCurrentEvent();
    if (currentEventResult.success) {
      const currentEvent = currentEventResult.event;
      
      // Update event status
      const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
      await updateDoc(settingsRef, {
        eventActive: false,
        status: 'completed',
        completedAt: serverTimestamp(),
        finalStats: {
          totalRounds: globalCount,
          totalParticipants: participants.length,
          activeParticipants: participants.filter(p => p.chantCount > 0).length
        }
      });
      
      // ✅ NEW: Automatically save to history
      const historyData = {
        ...currentEvent,
        completedAt: serverTimestamp(),
        finalStats: {
          totalRounds: globalCount,
          totalParticipants: participants.length,
          activeParticipants: participants.filter(p => p.chantCount > 0).length,
          topPerformers: participants
            .filter(p => p.chantCount > 0)
            .sort((a, b) => b.chantCount - a.chantCount)
            .slice(0, 10)
        },
        // Store top 10 participants for history
        topParticipants: participants
          .sort((a, b) => b.chantCount - a.chantCount)
          .slice(0, 10)
      };
      
      await addDoc(collection(db, EVENTS_HISTORY_COLLECTION), historyData);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error completing event:', error);
    return { success: false, error: error.message };
  }
};


// ✅ NEW: Auto-start function (silently updates event status in background)
const autoStartEvent = async () => {
  try {
    const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
    const docSnap = await getDoc(settingsRef);
    
    if (docSnap.exists()) {
      const eventData = docSnap.data();
      // Only auto-start if not manually controlled and status is 'created'
      if (!eventData.manuallyStartedAt && !eventData.manuallyPausedAt && eventData.status === 'created') {
        await updateDoc(settingsRef, {
          eventActive: true,
          status: 'active',
          autoStartedAt: serverTimestamp() // Track automatic start
        });
        console.log('🎯 Event auto-started based on schedule');
      }
    }
  } catch (error) {
    console.error('Error auto-starting event:', error);
  }
};

// Archive current event and reset participants
export const archiveCurrentEvent = async () => {
  try {
    const currentEventResult = await getCurrentEvent();
    
    if (currentEventResult.success) {
      const currentEvent = currentEventResult.event;
      
      // Get current participants and global count
      const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
      let globalCount = 0;
      const participants = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        globalCount += data.chantCount || 0;
        participants.push({ id: doc.id, ...data });
      });
      
      // Create archive entry with full participant data
      const archiveData = {
        ...currentEvent,
        archivedAt: serverTimestamp(),
        finalStats: {
          totalRounds: globalCount,
          totalParticipants: participants.length,
          activeParticipants: participants.filter(p => p.chantCount > 0).length,
          topPerformers: participants
            .filter(p => p.chantCount > 0)
            .sort((a, b) => b.chantCount - a.chantCount)
            .slice(0, 10) // Top 10 performers
        },
        participants: participants // Store all participant data for history
      };
      
      // Save to history
      await addDoc(collection(db, EVENTS_HISTORY_COLLECTION), archiveData);
      
      // ✅ RESET chant counts instead of deleting users
      const resetPromises = [];
      querySnapshot.forEach((docSnap) => {
        const userRef = doc(db, USERS_COLLECTION, docSnap.id);
        resetPromises.push(
          updateDoc(userRef, {
            chantCount: 0, // Reset to 0
            lastEventParticipated: currentEvent.eventName || 'Unknown Event',
            lastEventDate: serverTimestamp(),
            totalEventsParticipated: increment(1), // Track participation history
            archivedAt: serverTimestamp()
          })
        );
      });
      
      await Promise.all(resetPromises);
      
      console.log(`✅ Event archived successfully. ${participants.length} participants preserved with reset counts.`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error archiving event:', error);
    return { success: false, error: error.message };
  }
};

// ✅ FIXED: Get events history function
export const getEventsHistory = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, EVENTS_HISTORY_COLLECTION), 
      orderBy("archivedAt", "desc"),
      limit(limitCount) // ✅ Fixed: Use limit() function, not spread array
    );
    const querySnapshot = await getDocs(q);
    
    const events = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, events };
  } catch (error) {
    console.error('Error getting events history:', error);
    return { success: false, error: error.message, events: [] };
  }
};


// Dynamic event settings functions
export const updateEventSettings = async (settings) => {
  try {
    const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
    await setDoc(settingsRef, settings, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
};

// ✅ FIXED: Proper event status logic - time-based logic first for new events
export const getEventStatus = (eventSettings) => {
  // If no event settings, return inactive
  if (!eventSettings) {
    return 'NO_EVENT';
  }
  
  // ✅ If admin manually completed the event - always override
  if (eventSettings.status === 'completed') {
    return 'COMPLETED';
  }
  
  // ✅ Get current time for time-based logic
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
  
  const startTime = eventSettings?.startTime || 6;
  const endTime = eventSettings?.endTime || 24;
  const startTimeMinutes = startTime * 60;
  const endTimeMinutes = endTime * 60;
  
  // ✅ PRIORITY 1: Time-based logic for newly created events (no manual overrides yet)
  if (eventSettings.status === 'created' && !eventSettings.manuallyStartedAt && !eventSettings.manuallyPausedAt) {
    if (currentTime < startTimeMinutes) {
      return 'BEFORE_START'; // ✅ Show countdown timer
    } else if (currentTime >= startTimeMinutes && currentTime < endTimeMinutes) {
      // Auto-start the event
      autoStartEvent();
      return 'ACTIVE';
    } else {
      return 'ENDED';
    }
  }
  
  // ✅ PRIORITY 2: Manual admin overrides (for events that have been manually controlled)
  if (eventSettings.manuallyStartedAt && eventSettings.eventActive === true) {
    return 'ACTIVE';
  }
  
  if (eventSettings.manuallyPausedAt && eventSettings.eventActive === false) {
    return 'STOPPED';
  }
  
  // ✅ PRIORITY 3: Automatic time-based logic (for events without manual overrides)
  if (currentTime < startTimeMinutes) {
    return 'BEFORE_START';
  } else if (currentTime >= startTimeMinutes && currentTime < endTimeMinutes) {
    // During event hours - should be active unless manually paused
    if (eventSettings.eventActive === false && eventSettings.status === 'paused') {
      return 'STOPPED';
    }
    return 'ACTIVE';
  } else if (currentTime >= endTimeMinutes) {
    return 'ENDED';
  }
  
  // ✅ Development mode override
  if (DEV_MODE) {
    // In dev mode, prioritize showing countdown for new events
    if (eventSettings.status === 'created') {
      return 'BEFORE_START';
    }
    if (eventSettings.eventActive === false && eventSettings.status === 'paused') {
      return 'STOPPED';
    }
    return 'ACTIVE';
  }
  
  return 'BEFORE_START';
};


// Get time until start using dynamic settings
export const getTimeUntilStart = (eventSettings) => {
  const now = new Date();
  const today = new Date(now);
  const startTime = eventSettings?.startTime || 6;
  
  today.setHours(startTime, 0, 0, 0);
  
  if (now > today) {
    today.setDate(today.getDate() + 1);
  }
  
  return today.getTime() - now.getTime();
};

// ===== USER MANAGEMENT FUNCTIONS =====

export const createUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, USERS_COLLECTION), {
      ...userData,
      chantCount: 0,
      createdAt: new Date(),
      lastUpdated: new Date(),
      role: userData.role || USER_ROLES.FOLK_BOY
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

export const checkPhoneExists = async (phoneNumber) => {
  try {
    // ✅ CHANGED: Check both formats during transition period
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Create queries for both possible formats
    const queries = [
      // Query for 10-digit format (new format)
      query(collection(db, USERS_COLLECTION), where("phone", "==", cleanPhone)),
      // Query for 12-digit format (old format with +91)
      query(collection(db, USERS_COLLECTION), where("phone", "==", `91${cleanPhone}`)),
      query(collection(db, USERS_COLLECTION), where("phone", "==", `+91${cleanPhone}`))
    ];
    
    // Check all possible formats
    for (const q of queries) {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return true; // Found user in any format
      }
    }
    
    return false; // User not found in any format
  } catch (error) {
    console.error('Error checking phone:', error);
    return false;
  }
};


export const getUserByPhone = async (phoneNumber) => {
  try {
    // ✅ CHANGED: Search both formats during transition period
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Create queries for both possible formats
    const queries = [
      // Query for 10-digit format (new format)
      query(collection(db, USERS_COLLECTION), where("phone", "==", cleanPhone)),
      // Query for 12-digit format (old format with +91)
      query(collection(db, USERS_COLLECTION), where("phone", "==", `91${cleanPhone}`)),
      query(collection(db, USERS_COLLECTION), where("phone", "==", `+91${cleanPhone}`))
    ];
    
    // Try each format until we find the user
    for (const q of queries) {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { success: true, user: { id: doc.id, ...doc.data() } };
      }
    }
    
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};


// ✅ NEW: Set user's total chant count (replacement, not additive)
export const setUserTotalChantCount = async (userId, totalRounds) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    // Check if document exists first
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Document exists - update it with new total
      await updateDoc(userRef, {
        chantCount: totalRounds, // ✅ Set to exact total (not increment)
        lastUpdated: new Date()
      });
    } else {
      // Document doesn't exist - create it
      const savedUser = localStorage.getItem('ekadashi-user');
      let userData = { fullName: 'Unknown User', phone: 'Unknown', role: USER_ROLES.FOLK_BOY }; 
      // ✅ NEW: Default role
      
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          userData = {
            fullName: parsedUser.fullName || 'Unknown User',
            phone: parsedUser.phone || 'Unknown',
            role: parsedUser.role || USER_ROLES.FOLK_BOY
            // ✅ NEW: Include role from saved user
          };
        } catch (e) {
          console.error('Error parsing saved user:', e);
        }
      }
      
      // Create new document with total chant count
      await setDoc(userRef, {
        ...userData,
        chantCount: totalRounds,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting total chant count:', error);
    return { success: false, error: error.message };
  }
};


export const updateUserChantCount = async (userId, newRounds) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    // ✅ Check if document exists first
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Document exists - update it
      await updateDoc(userRef, {
        chantCount: increment(newRounds),
        lastUpdated: new Date()
      });
    } else {
      // ✅ Document doesn't exist - create it
      console.log('User document not found, recreating...');
      
      // Try to get user info from localStorage
      const savedUser = localStorage.getItem('ekadashi-user');
      let userData = { fullName: 'Unknown User', phone: 'Unknown', role: USER_ROLES.FOLK_BOY };
      // ✅ NEW: Default role
      
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          userData = {
            fullName: parsedUser.fullName || 'Unknown User',
            phone: parsedUser.phone || 'Unknown',
            role: parsedUser.role || USER_ROLES.FOLK_BOY
          };
          // ✅ NEW: Include role from saved user
        } catch (e) {
          console.error('Error parsing saved user:', e);
        }
      }
      
      // Create new document with initial chant count
      await setDoc(userRef, {
        ...userData,
        chantCount: newRounds,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating chant count:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToLeaderboard = (callback) => {
  const q = query(
    collection(db, USERS_COLLECTION), 
    orderBy("chantCount", "desc")
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    callback(users);
  });
};

export const subscribeToGlobalCount = (callback) => {
  return onSnapshot(collection(db, USERS_COLLECTION), (querySnapshot) => {
    let totalCount = 0;
    querySnapshot.forEach((doc) => {
      totalCount += doc.data().chantCount || 0;
    });
    callback(totalCount);
  });
};

// ✅ NEW: Subscribe to real-time updates for a specific user's chant count
export const subscribeToUserChantCount = (userId, callback) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data();
      callback(userData.chantCount || 0);
    } else {
      // User document doesn't exist, return 0
      callback(0);
    }
  }, (error) => {
    console.error('Error listening to user chant count:', error);
    callback(0); // Fallback to 0 on error
  });
};


// ===== ADMIN AUTHENTICATION =====

export const authenticateAdmin = (phone, password) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone === ADMIN_PHONE && password === ADMIN_PASSWORD;
};

export const isAdmin = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone === ADMIN_PHONE;
};
