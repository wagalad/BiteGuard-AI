import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getBlob } from 'firebase/storage';
import { GeminiAnalysis, SavedScan } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)"
};

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
export const storage = app ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseConfigured = Boolean(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorLog {
  error: string;
  operationType: OperationType;
  path: string | null;
  userId: string | undefined;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorLog = {
    error: error instanceof Error ? error.message : String(error),
    userId: auth?.currentUser?.uid,
    operationType,
    path
  };
  console.error('Firestore Error:', errInfo);
  throw new Error('Unable to complete this request right now. Please try again.');
}

function createScanStoragePath(userId: string) {
  const uniqueId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `scans/${userId}/${uniqueId}.jpg`;
}

async function uploadScanImage(userId: string, image: string) {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const storagePath = createScanStoragePath(userId);
  const imageRef = ref(storage, storagePath);
  await uploadString(imageRef, image, 'data_url');
  return storagePath;
}

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Sign in is unavailable right now.");
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
  if (!db || !storage) {
    console.warn("Firebase persistence is not fully initialized. Scan not saved.");
    return null;
  }
  const path = 'scans';
  try {
    const imagePath = await uploadScanImage(userId, image);
    const docRef = await addDoc(collection(db, path), {
      userId,
      imagePath,
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
    return Promise.all(querySnapshot.docs.map(async (scanDoc): Promise<SavedScan> => {
      const data = scanDoc.data() as Omit<SavedScan, 'id' | 'image' | 'usesObjectUrl'> & {
        image?: string;
      };

      let image = data.image || '';
      let usesObjectUrl = false;

      if (!image && data.imagePath && storage) {
        try {
          const blob = await getBlob(ref(storage, data.imagePath));
          image = URL.createObjectURL(blob);
          usesObjectUrl = true;
        } catch (storageError) {
          console.error('Failed to load scan image from storage:', {
            scanId: scanDoc.id,
            imagePath: data.imagePath,
            error: storageError instanceof Error ? storageError.message : String(storageError),
          });
        }
      }

      return {
        id: scanDoc.id,
        ...data,
        image,
        usesObjectUrl,
      };
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};
