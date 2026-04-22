// Force cache bust to recognize Env vars
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA5mrqg_DCHPHfAEreWAs99sX7VmXr3vzE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'equipanet-ab9f4.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'equipanet-ab9f4',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'equipanet-ab9f4.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '876674833991',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:876674833991:web:4e85f7ca4d1691773d9b62',
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = true;

// Initialize Firebase (prevent multiple instances during hot reload)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase initialization failed. Running in demo mode.', error);
  // Create a minimal app for demo purposes
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  storage = getStorage(app);
}

export { auth, db, storage };
export default app;
