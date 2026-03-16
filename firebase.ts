import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { GeminiAnalysis } from './types';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
function initializeFirebase() {
  if (getApps().length > 0) return getApp();
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "") {
    console.warn("Firebase API Key is missing. Firebase features will be disabled.");
    return null;
  }
  try {
    return initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Failed to initialize Firebase:", e);
    return null;
  }
}

const app = initializeFirebase();

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)") : null;
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Initialize user profile in Firestore if it doesn't exist
    if (db) {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          role: 'user',
          displayName: user.displayName
        });
      }
    }
    
    return user;
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

export const logout = () => auth ? signOut(auth) : Promise.resolve();

export const saveScan = async (userId: string, image: string, analysis: GeminiAnalysis) => {
  if (!db) {
    console.warn("Firestore is not initialized. Scan not saved.");
    return null;
  }
  const path = 'scans';
  try {
    const docRef = await addDoc(collection(db, path), {
      userId,
      image,
      analysis,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getUserScans = async (userId: string) => {
  if (!db) {
    console.warn("Firestore is not initialized. Cannot fetch scans.");
    return [];
  }
  const path = 'scans';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};
