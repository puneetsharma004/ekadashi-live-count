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

export const getEventStatus = () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  if (currentHour < EVENT_START_TIME) {
    return 'BEFORE_START';
  } else if (currentHour >= EVENT_END_TIME) {
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
