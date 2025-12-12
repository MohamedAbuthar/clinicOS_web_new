import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    try {
        const { email, newPassword } = await req.json();

        if (!email || !newPassword) {
            return NextResponse.json(
                { success: false, message: 'Email and new password are required' },
                { status: 400 }
            );
        }

        if (!adminAuth) {
            const missingVars = [];
            if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
            if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
            if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');

            console.error('Admin Auth not initialized. Missing vars:', missingVars.join(', '));
            return NextResponse.json(
                {
                    success: false,
                    message: `Server configuration error. Missing vars: ${missingVars.join(', ')}. Please check .env.local`
                },
                { status: 500 }
            );
        }

        // Get user by email
        const userRecord = await adminAuth.getUserByEmail(email);

        // Update password
        await adminAuth.updateUser(userRecord.uid, {
            password: newPassword,
        });

        console.log(`Password updated for user: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error: any) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update password' },
            { status: 500 }
        );
    }
}
