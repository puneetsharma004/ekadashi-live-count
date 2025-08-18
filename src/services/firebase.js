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
  increment 
} from 'firebase/firestore';

// TODO: Replace with your Firebase config
// Get this from: Firebase Console → Project Settings → General → Your apps
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
export const DEV_MODE = true; // Change to false for production

// Admin credentials - change these!
export const ADMIN_PHONE = "1234567890"; // Admin phone number
export const ADMIN_PASSWORD = "admin123"; // Simple admin password

// Dynamic event settings
export let DYNAMIC_EVENT_START_TIME = 6; // 6:00 AM
export let DYNAMIC_EVENT_END_TIME = 24;  // Midnight
export let DYNAMIC_GLOBAL_GOAL = 666;

// Admin functions to update settings
export const updateEventSettings = async (settings) => {
  try {
    const settingsRef = doc(db, 'eventSettings', 'current');
    await updateDoc(settingsRef, settings);
    
    // Update local variables
    DYNAMIC_EVENT_START_TIME = settings.startTime || DYNAMIC_EVENT_START_TIME;
    DYNAMIC_EVENT_END_TIME = settings.endTime || DYNAMIC_EVENT_END_TIME;
    DYNAMIC_GLOBAL_GOAL = settings.globalGoal || DYNAMIC_GLOBAL_GOAL;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
};



// Admin authentication
export const authenticateAdmin = (phone, password) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone === ADMIN_PHONE && password === ADMIN_PASSWORD;
};

// Check if user is admin
export const isAdmin = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone === ADMIN_PHONE;
};


// Collection references
export const USERS_COLLECTION = 'users';
export const GLOBAL_STATS_COLLECTION = 'globalStats';

// User management functions
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

// Real-time listeners
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

// Event timing functions
export const EVENT_START_TIME = 6; // 6:00 AM
export const EVENT_END_TIME = 24;  // Midnight (24:00)
export const GLOBAL_GOAL = 666;

// Updated event status function
export const getEventStatus = () => {
  // In development mode, always return ACTIVE for testing
  if (DEV_MODE) {
    return 'ACTIVE';
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  
  if (currentHour < DYNAMIC_EVENT_START_TIME) {
    return 'BEFORE_START';
  } else if (currentHour >= DYNAMIC_EVENT_END_TIME) {
    return 'ENDED';
  } else {
    return 'ACTIVE';
  }
};

export const getTimeUntilStart = () => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(EVENT_START_TIME, 0, 0, 0);
  
  if (now > today) {
    // Event started today or tomorrow
    today.setDate(today.getDate() + 1);
  }
  
  return today.getTime() - now.getTime();
};
