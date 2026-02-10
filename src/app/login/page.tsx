'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserDetailsDTO } from '@/services/auth';

export default function LoginPage() {
    const router = useRouter();
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpUid, setOtpUid] = useState<string | null>(null);
    const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // 1. Pre-validate: Check if user exists and is active
            let userDetails;
            try {
                const userRes = await authService.getUserDetails(mobileNumber);
                userDetails = userRes.data;
            } catch (err) {
                // Determine if it's a 404/Not Found or other error
                // For security/UX, we can just say "User not found or access denied"
                throw new Error('User not registered. Please contact support.');
            }

            if (!userDetails || !userDetails.isActive) {
                throw new Error('User account is inactive. Please contact support.');
            }

            // 2. Send OTP if user is valid
            const response = await authService.sendOtp(mobileNumber);
            if (response.id) {
                setOtpUid(response.id);
                setStep('OTP');
                // Optionally store userDetails in state to avoid re-fetching later, 
                // but re-fetching in verify step is safer/consistent with previous flow.
            } else {
                setError('Failed to receive OTP ID');
            }
        } catch (err) {
            setError((err as Error).message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpUid) return;

        setLoading(true);
        setError(null);
        try {
            // 1. Verify OTP
            await authService.verifyOtp(otpUid, otp, mobileNumber);

            // 2. Fetch User Details to get Flow Name
            const userRes = await authService.getUserDetails(mobileNumber);
            const userDetails = userRes.data;

            if (userDetails && userDetails.flowName) {
                // 3. Set Cookie for Flow Name (Expires in 30 days)
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                document.cookie = `flowName=${encodeURIComponent(userDetails.flowName)}; path=/; expires=${expiryDate.toUTCString()}`;

                // Also store full user details in localStorage for client-side access if needed
                localStorage.setItem('userDetails', JSON.stringify(userDetails));

                // 4. Redirect to Dashboard
                router.push('/');
            } else {
                setError('User configuration not found (Flow Name missing)');
            }
        } catch (err) {
            setError((err as Error).message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Login
                </h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                {step === 'MOBILE' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={10}
                                value={mobileNumber}
                                onChange={(e) => {
                                    // Remove any non-digit characters
                                    const value = e.target.value.replace(/\D/g, '');
                                    // Update state only if length is within limit (redundant with slice but safe)
                                    if (value.length <= 10) {
                                        setMobileNumber(value);
                                    }
                                }}
                                placeholder="Enter 10-digit number"
                                className="w-full bg-white border border-gray-300 rounded p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter OTP"
                                className="w-full bg-white border border-gray-300 rounded p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('MOBILE')}
                            className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
                        >
                            Back to Mobile Number
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
