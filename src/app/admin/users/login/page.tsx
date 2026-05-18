'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { adminService, ADMIN_SESSION_KEY } from '@/services/adminService';

export default function AdminLoginPage() {
    const router = useRouter();
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpUid, setOtpUid] = useState<string | null>(null);
    const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        // If already logged in as admin, redirect to users page
        const session = adminService.getSession();
        if (session && adminService.isAdmin(session)) {
            router.replace('/admin/users');
        } else {
            setCheckingSession(false);
        }
    }, [router]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Pre-validate: user must exist and be active
            let userDetails;
            try {
                const userRes = await authService.getUserDetails(mobileNumber);
                userDetails = userRes.data;
            } catch {
                throw new Error('User not found. Please contact your administrator.');
            }

            if (!userDetails || !userDetails.isActive) {
                throw new Error('Your account is inactive. Please contact support.');
            }

            const levels = (userDetails.accessLevel || '').split(',').map((s: string) => s.trim());
            if (!levels.includes('admin')) {
                throw new Error('Access denied. Admin privileges required.');
            }

            const response = await authService.sendOtp(mobileNumber);
            if (response.id) {
                setOtpUid(response.id);
                setStep('OTP');
            } else {
                throw new Error('Failed to receive OTP. Please try again.');
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
            await authService.verifyOtp(otpUid, otp, mobileNumber);

            const userRes = await authService.getUserDetails(mobileNumber);
            const userDetails = userRes.data;

            const levels2 = (userDetails?.accessLevel || '').split(',').map((s: string) => s.trim());
            if (!userDetails || !levels2.includes('admin')) {
                throw new Error('Access denied. Admin privileges required.');
            }

            adminService.setSession({
                mobileNumber: userDetails.mobileNumber,
                userName: userDetails.userName,
                accessLevel: userDetails.accessLevel ?? '',
            });

            // Store in sessionStorage under well-known key (already done above)
            router.replace('/admin/users');
        } catch (err) {
            setError((err as Error).message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div className="admin-login-root">
            <style>{`
                .admin-login-root {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%);
                    padding: 1rem;
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                }
                .admin-login-card {
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    padding: 2.5rem 2rem;
                    width: 100%;
                    max-width: 420px;
                    box-shadow: 0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset;
                }
                .admin-login-logo {
                    width: 52px;
                    height: 52px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    margin: 0 auto 1.2rem;
                    box-shadow: 0 8px 24px rgba(99,102,241,0.35);
                }
                .admin-login-title {
                    text-align: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin-bottom: 0.4rem;
                    letter-spacing: -0.02em;
                }
                .admin-login-subtitle {
                    text-align: center;
                    font-size: 0.82rem;
                    color: #64748b;
                    margin-bottom: 2rem;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                .admin-form-group {
                    margin-bottom: 1.1rem;
                }
                .admin-form-label {
                    display: block;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: #94a3b8;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .admin-form-input {
                    width: 100%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 0.8rem 1rem;
                    color: #f1f5f9;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }
                .admin-form-input::placeholder { color: #475569; }
                .admin-form-input:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
                }
                .admin-btn-primary {
                    width: 100%;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: #fff;
                    font-weight: 700;
                    font-size: 0.95rem;
                    border: none;
                    border-radius: 10px;
                    padding: 0.85rem;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
                    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
                    letter-spacing: 0.02em;
                }
                .admin-btn-primary:hover:not(:disabled) {
                    opacity: 0.92;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(99,102,241,0.4);
                }
                .admin-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                .admin-btn-ghost {
                    width: 100%;
                    background: transparent;
                    color: #64748b;
                    font-size: 0.85rem;
                    border: none;
                    border-radius: 8px;
                    padding: 0.65rem;
                    cursor: pointer;
                    transition: color 0.2s;
                    margin-top: 0.5rem;
                }
                .admin-btn-ghost:hover { color: #94a3b8; }
                .admin-error-box {
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.25);
                    border-radius: 10px;
                    padding: 0.75rem 1rem;
                    color: #f87171;
                    font-size: 0.85rem;
                    margin-bottom: 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .admin-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    background: rgba(99,102,241,0.15);
                    border: 1px solid rgba(99,102,241,0.25);
                    border-radius: 6px;
                    padding: 0.25rem 0.6rem;
                    color: #a5b4fc;
                    font-size: 0.72rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin: 0 auto 1.5rem;
                    display: flex;
                    width: fit-content;
                    margin: 0 auto 1.5rem;
                }
                .admin-divider {
                    border: none;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    margin: 1.5rem 0 1.2rem;
                }
                .admin-otp-hint {
                    text-align: center;
                    font-size: 0.8rem;
                    color: #475569;
                    margin-top: 0.75rem;
                }
            `}</style>

            <div className="admin-login-card">
                <div className="admin-login-logo">🛡️</div>
                <h1 className="admin-login-title">Admin Portal</h1>
                <p className="admin-login-subtitle">User Management</p>

                <div className="admin-badge">
                    🔐 Restricted Access
                </div>

                {error && (
                    <div className="admin-error-box">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {step === 'MOBILE' ? (
                    <form onSubmit={handleSendOtp}>
                        <div className="admin-form-group">
                            <label className="admin-form-label" htmlFor="adminMobile">
                                Mobile Number
                            </label>
                            <input
                                id="adminMobile"
                                className="admin-form-input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={10}
                                value={mobileNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setMobileNumber(val);
                                }}
                                placeholder="Enter 10-digit mobile number"
                                required
                                autoFocus
                            />
                        </div>
                        <button
                            id="adminSendOtpBtn"
                            type="submit"
                            className="admin-btn-primary"
                            disabled={loading || mobileNumber.length !== 10}
                        >
                            {loading ? '⏳ Verifying...' : 'Send OTP →'}
                        </button>
                        <p className="admin-otp-hint">
                            Only authorised admin numbers can proceed
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                OTP sent to <span style={{ color: '#a5b4fc', fontWeight: 600 }}>+91 {mobileNumber}</span>
                            </p>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label" htmlFor="adminOtp">
                                Enter OTP
                            </label>
                            <input
                                id="adminOtp"
                                className="admin-form-input"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="6-digit OTP"
                                required
                                autoFocus
                                style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.3rem' }}
                            />
                        </div>
                        <button
                            id="adminVerifyOtpBtn"
                            type="submit"
                            className="admin-btn-primary"
                            disabled={loading || otp.length < 4}
                        >
                            {loading ? '⏳ Verifying...' : '✓ Verify & Enter'}
                        </button>
                        <button
                            type="button"
                            className="admin-btn-ghost"
                            onClick={() => { setStep('MOBILE'); setOtp(''); setError(null); }}
                        >
                            ← Change Number
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
