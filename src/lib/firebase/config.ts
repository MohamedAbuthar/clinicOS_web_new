// Firebase Configuration
// Complete Firebase setup with Auth, Firestore, and Analytics
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxiNhzHX_GqL67RSzwXuEl1ODz84GtYww",
  authDomain: "areal-59464.firebaseapp.com",
  projectId: "areal-59464",
  storageBucket: "areal-59464.firebasestorage.app",
  messagingSenderId: "715403586937",
  appId: "1:715403586937:web:3940b4a3061776d7b4d3a8",
  measurementId: "G-4ZW4YH22PX"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;
let secondaryApp: FirebaseApp | null = null;
let secondaryAuth: Auth | null = null;

// Only initialize if not already initialized
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Set auth persistence to LOCAL (persists across browser sessions)
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('✅ Firebase Auth persistence set to LOCAL');
      })
      .catch((error) => {
        console.error('❌ Error setting auth persistence:', error);
      });
    analytics = getAnalytics(app);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  if (typeof window !== 'undefined') {
    // Set persistence for existing auth instance
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('❌ Error setting auth persistence:', error);
    });
    analytics = getAnalytics(app);
  }
}

// Create a secondary app for creating users without affecting current session
export const getSecondaryAuth = (): Auth => {
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'Secondary');
    secondaryAuth = getAuth(secondaryApp);
  }
  return secondaryAuth!;
};

export { app, auth, db, storage, analytics };
export default app;

