// Firebase Configuration
// This file contains the Firebase initialization and configuration
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
let analytics: Analytics | null = null;

// Only initialize if not already initialized
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  
  // Analytics should only be initialized on the client side
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} else {
  app = getApps()[0];
  
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
}

export { app, analytics };
export default app;

