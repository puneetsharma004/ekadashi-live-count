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
  Timestamp
} from 'firebase/firestore';

// TODO: Replace with your Firebase config
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
export const DEV_MODE = true;

// Admin credentials - change these!
export const ADMIN_PHONE = "1234567890";
export const ADMIN_PASSWORD = "admin123";

// Collection references
export const USERS_COLLECTION = 'users';
export const EVENT_SETTINGS_COLLECTION = 'eventSettings';
export const EVENTS_HISTORY_COLLECTION = 'eventsHistory'; // New: Event history

// ✅ NEW: Advanced Event Management Functions

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

// Start event manually
export const startEvent = async () => {
  try {
    const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
    await updateDoc(settingsRef, {
      eventActive: true,
      status: 'active',
      startedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error starting event:', error);
    return { success: false, error: error.message };
  }
};

// Stop event manually
export const stopEvent = async () => {
  try {
    const settingsRef = doc(db, EVENT_SETTINGS_COLLECTION, 'current');
    await updateDoc(settingsRef, {
      eventActive: false,
      status: 'paused',
      pausedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error stopping event:', error);
    return { success: false, error: error.message };
  }
};

// Complete event (final stop)
export const completeEvent = async () => {
  try {
    // Get current stats inline
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    let globalCount = 0;
    const participants = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      globalCount += data.chantCount || 0;
      participants.push({ id: doc.id, ...data });
    });
    
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
    
    return { success: true };
  } catch (error) {
    console.error('Error completing event:', error);
    return { success: false, error: error.message };
  }
};

// Archive current event and clear participants
export const archiveCurrentEvent = async () => {
  try {
    const currentEventResult = await getCurrentEvent();
    
    if (currentEventResult.success) {
      const currentEvent = currentEventResult.event;
      
      // Get current participants and global count inline
      const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
      let globalCount = 0;
      const participants = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        globalCount += data.chantCount || 0;
        participants.push({ id: doc.id, ...data });
      });
      
      // Create archive entry
      const archiveData = {
        ...currentEvent,
        archivedAt: serverTimestamp(),
        finalStats: {
          totalRounds: globalCount,
          totalParticipants: participants.length,
          activeParticipants: participants.filter(p => p.chantCount > 0).length,
          topPerformers: participants.slice(0, 10) // Top 10
        },
        participants: participants // Store all participant data
      };
      
      // Save to history
      await addDoc(collection(db, EVENTS_HISTORY_COLLECTION), archiveData);
      
      // Clear all participants inline
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);
      
      console.log('Event archived successfully');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error archiving event:', error);
    return { success: false, error: error.message };
  }
};

// Helper: Get all participants
const getAllParticipants = async () => {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy("chantCount", "desc"));
    const querySnapshot = await getDocs(q);
    const participants = [];
    querySnapshot.forEach((doc) => {
      participants.push({ id: doc.id, ...doc.data() });
    });
    return participants;
  } catch (error) {
    console.error('Error getting participants:', error);
    return [];
  }
};

// Helper: Clear all participants
const clearAllParticipants = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const deletePromises = [];
    
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log('All participants cleared');
  } catch (error) {
    console.error('Error clearing participants:', error);
  }
};

// Get events history
export const getEventsHistory = async (limit = 10) => {
  try {
    const q = query(
      collection(db, EVENTS_HISTORY_COLLECTION), 
      orderBy("archivedAt", "desc"),
      ...(limit ? [limit] : [])
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

// ✅ NEW: Dynamic event settings functions
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

// Enhanced event status function
export const getEventStatus = (eventSettings) => {
  // If no event settings, return inactive
  if (!eventSettings) {
    return 'NO_EVENT';
  }
  
  // Manual control overrides everything
  if (eventSettings.eventActive === false) {
    return eventSettings.status === 'completed' ? 'COMPLETED' : 'STOPPED';
  }
  
  if (eventSettings.eventActive === true) {
    return 'ACTIVE';
  }
  
  // In development mode, show based on status
  if (DEV_MODE) {
    if (eventSettings.status === 'created') return 'BEFORE_START';
    if (eventSettings.status === 'active') return 'ACTIVE';
    if (eventSettings.status === 'completed') return 'COMPLETED';
    return 'BEFORE_START';
  }
  
  // Time-based logic for production
  const now = new Date();
  const currentHour = now.getHours();
  const startTime = eventSettings?.startTime || 6;
  const endTime = eventSettings?.endTime || 24;
  
  if (currentHour < startTime) {
    return 'BEFORE_START';
  } else if (currentHour >= endTime) {
    return 'ENDED';
  } else {
    return 'ACTIVE';
  }
};

// ✅ UPDATED: Get time until start using dynamic settings
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

// Rest of your existing functions remain the same...
export const createUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, USERS_COLLECTION), {
      ...userData,
      chantCount: 0,
      createdAt: new Date(),
      lastUpdated: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

export const checkPhoneExists = async (phoneNumber) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where("phone", "==", phoneNumber)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking phone:', error);
    return false;
  }
};

export const getUserByPhone = async (phoneNumber) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where("phone", "==", phoneNumber)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { success: true, user: { id: doc.id, ...doc.data() } };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserChantCount = async (userId, newRounds) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      chantCount: increment(newRounds),
      lastUpdated: new Date()
    });
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

// Admin authentication
export const authenticateAdmin = (phone, password) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone === ADMIN_PHONE && password === ADMIN_PASSWORD;
};

export const isAdmin = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone === ADMIN_PHONE;
};
