import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, KeyRound, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { updateUserPassword } from '@/lib/firebase/auth';
import { toast } from 'sonner';

interface ForgotPasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'email' | 'otp' | 'password';

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const { sendOTP, verifyOTP, isAuthenticated } = usePatientAuth();

    // Timer for OTP
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep('email');
                setEmail('');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setLoading(false);
                setTimeLeft(0);
            }, 300);
        }
    }, [isOpen]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const result = await sendOTP(email);
            if (result.success) {
                toast.success('OTP sent to your email');
                setStep('otp');
                setTimeLeft(180); // 3 minutes
            } else {
                toast.error(result.message || 'Failed to send OTP');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return;

        setLoading(true);
        try {
            // Only verify the OTP, avoid full login since we don't know the password
            const result = await verifyOTP(email, otp);
            if (result.success) {
                toast.success('Email verified successfully');
                setStep('password');
            } else {
                toast.error(result.message || 'Invalid OTP');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const result = await updateUserPassword(newPassword, email);
            if (result.success) {
                toast.success('Password updated successfully');
                onClose();
            } else {
                toast.error('Failed to update password');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        {step !== 'email' && (
                            <button
                                onClick={() => setStep(step === 'password' ? 'otp' : 'email')}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h2 className="text-lg font-semibold text-gray-900">
                            {step === 'email' ? 'Forgot Password' :
                                step === 'otp' ? 'Verify Email' : 'Reset Password'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'email' && (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <KeyRound className="w-6 h-6" />
                                </div>
                                <p className="text-gray-500 text-sm">
                                    Enter your email address and we'll send you an OTP to verify your identity.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <p className="text-gray-600 font-medium">{email}</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    Enter the 6-digit code sent to your email.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">One-Time Password</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-center tracking-[0.5em] text-lg font-medium"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                                <div className="flex justify-between items-center mt-2 text-sm">
                                    <span className={timeLeft > 0 ? 'text-teal-600 font-medium' : 'text-red-500'}>
                                        {timeLeft > 0 ? formatTime(timeLeft) : 'Code expired'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={timeLeft > 0 || loading}
                                        className="text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                            </button>
                        </form>
                    )}

                    {step === 'password' && (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <p className="text-gray-500 text-sm">
                                    Create a new strong password for your account.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Min. 6 characters"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Re-enter password"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !newPassword || !confirmPassword}
                                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordDialog;
