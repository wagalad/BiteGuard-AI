import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { GeminiAnalysis } from './types';

// Configuration strategy:
// Use environment variables (VITE_*) which are set in Vercel or AI Studio Settings.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";

// Initialize Firebase
function initializeFirebase() {
  if (getApps().length > 0) return getApp();

  try {
    return initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    // Fallback to dummy to prevent total crash
    return initializeApp({ apiKey: "dummy", projectId: "dummy", appId: "dummy" });
  }
}

const app = initializeFirebase();

export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
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

export const logout = () => signOut(auth);

export const saveScan = async (userId: string, image: string, analysis: GeminiAnalysis) => {
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
