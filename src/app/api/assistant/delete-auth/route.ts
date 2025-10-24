import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * API endpoint to delete a user from Firebase Authentication
 * 
 * This uses Firebase Admin SDK to delete users from Firebase Auth
 * Setup required:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Add service account credentials to .env.local
 * 3. See ASSISTANT_DELETE_SETUP.md for detailed instructions
 */

// Initialize Firebase Admin (only if credentials are available)
let adminAuth: any = null;

async function getAdminAuth() {
  if (adminAuth) return adminAuth;

  // Check if Firebase Admin credentials are configured
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK credentials not configured. User will not be deleted from Firebase Auth.');
    return null;
  }

  try {
    // Dynamically import firebase-admin (only if installed)
    const admin = await import('firebase-admin');
    
    // Initialize if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }

    adminAuth = admin.auth();
    return adminAuth;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    console.warn('Make sure firebase-admin is installed: npm install firebase-admin');
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Delete Auth User Request:', { userId });

    // Try to get admin auth
    const auth = await getAdminAuth();
    
    if (!auth) {
      // Admin SDK not configured - return success but log warning
      console.warn('Firebase Admin SDK not configured. User deleted from Firestore but not from Authentication.');
      return NextResponse.json({
        success: true,
        message: 'User deleted from database (Auth deletion skipped - Admin SDK not configured)',
        warning: 'Firebase Admin SDK not configured',
      });
    }

    // Delete user from Firebase Authentication
    await auth.deleteUser(userId);
    console.log('Successfully deleted user from Firebase Auth:', userId);

    return NextResponse.json({
      success: true,
      message: 'User authentication account deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting auth user:', err);
    
    // If user not found in Auth, that's okay (might already be deleted)
    if (err instanceof Error && err.message.includes('no user record')) {
      console.log('User not found in Firebase Auth (might be already deleted)');
      return NextResponse.json({
        success: true,
        message: 'User not found in authentication (might be already deleted)',
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

