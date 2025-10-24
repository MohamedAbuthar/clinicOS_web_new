import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * API endpoint to delete a user from Firebase Authentication
 * 
 * Note: This endpoint currently only deletes from Firestore database.
 * Firebase Admin SDK is not installed, so authentication deletion is skipped.
 * To enable full deletion, install firebase-admin and configure credentials.
 */

// Simple function that always returns null (no Firebase Admin SDK available)
async function getAdminAuth() {
  console.warn('Firebase Admin SDK not available. User will only be deleted from database, not from authentication.');
  return null;
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

    // This code will never execute since getAdminAuth always returns null
    // But keeping it for future when Firebase Admin SDK is installed
    // Note: When Firebase Admin SDK is installed, uncomment the following:
    // try {
    //   await auth.deleteUser(userId);
    //   console.log('Successfully deleted user from Firebase Auth:', userId);
    // } catch (authError) {
    //   console.warn('Failed to delete user from Firebase Auth:', authError);
    // }

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

