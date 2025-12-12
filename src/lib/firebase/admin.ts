import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            console.log('Firebase Admin initialized successfully');
        } catch (error: any) {
            console.error('Firebase Admin initialization error', error.stack);
        }
    } else {
        console.warn('Firebase Admin skipped: Missing environment variables');
    }
}

// Export auth only if initialized, otherwise undefined/null which we check in usage
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
