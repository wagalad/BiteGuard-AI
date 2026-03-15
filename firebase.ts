import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { GeminiAnalysis } from './types';

// Load Firebase config from environment variable injected by Vite
const firebaseConfig = import.meta.env.VITE_FIREBASE_CONFIG || {};

// Initialize Firebase with a check for required fields
function initializeFirebase() {
  if (getApps().length > 0) return getApp();
  
  // Check if we have a valid config
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase configuration is missing or incomplete. Some features will be disabled.");
    return null;
  }
  
  try {
    return initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return null;
  }
}

const app = initializeFirebase();

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!auth) {
    alert("Authentication is not configured. Please check your Firebase settings.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error.code, error.message);
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn("Popup was closed before finishing the sign-in.");
    } else if (error.code === 'auth/unauthorized-domain') {
      console.error("This domain is not authorized in the Firebase Console.");
    }
    throw error;
  }
};

export const logout = () => auth && signOut(auth);

export const saveScan = async (userId: string, image: string, analysis: GeminiAnalysis) => {
  if (!db) {
    console.error("Database is not configured.");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, 'scans'), {
      userId,
      image,
      analysis,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving scan", error);
    throw error;
  }
};

export const getUserScans = async (userId: string) => {
  if (!db) {
    console.error("Database is not configured.");
    return [];
  }
  try {
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting scans", error);
    throw error;
  }
};
