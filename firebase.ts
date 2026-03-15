import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { GeminiAnalysis } from './types';
import firebaseConfig from './firebase-applet-config.json';

const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId || "(default)";

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
