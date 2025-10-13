'use client';

import { useEffect } from 'react';
import { app, analytics } from './config';

/**
 * Firebase Initializer Component
 * This component initializes Firebase services when the app loads.
 * It only runs on the client side.
 * 
 * NOTE: This ONLY initializes Firebase for hosting and analytics.
 * All authentication and API calls still go through your Express.js backend.
 */
export default function FirebaseInitializer() {
  useEffect(() => {
    // Firebase is automatically initialized when the config is imported
    // This effect just ensures it happens on client-side only
    if (typeof window !== 'undefined') {
      console.log('Firebase initialized for hosting');
      if (analytics) {
        console.log('Firebase Analytics ready');
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
}

