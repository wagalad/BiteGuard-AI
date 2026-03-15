import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { GeminiAnalysis } from './types';

// Firebase configuration is injected via Vite's define or environment variables
const config = (import.meta as any).env?.VITE_FIREBASE_CONFIG || {};

const firebaseConfig = {
  apiKey: config.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || "dummy-key",
  authDomain: config.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = config.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Firebase initialization failed", e);
  // Create a dummy app to prevent crashes, though features won't work
  app = initializeApp({ apiKey: "dummy", projectId: "dummy", appId: "dummy" });
}

export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const saveScan = async (userId: string, imageData: string, analysis: GeminiAnalysis) => {
  try {
    const docRef = await addDoc(collection(db, 'scans'), {
      userId,
      imageData,
      analysis,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving scan to Firestore", error);
    throw error;
  }
};

export const getUserScans = async (userId: string) => {
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
    console.error("Error fetching user scans", error);
    throw error;
  }
};
