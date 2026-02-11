"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { STORAGE_KEYS } from '@/config/constants';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifySuccessPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const error = searchParams.get('error');
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');

        if (error === 'invalid') {
            setStatus('error');
            setErrorMessage('This verification link is invalid or has expired. Please request a new one.');
            return;
        }

        if (error === 'already_verified') {
            setStatus('already_verified');
            return;
        }

        if (token && userParam) {
            try {
                // Store auth credentials
                localStorage.setItem(STORAGE_KEYS.TOKEN, token);
                const userData = JSON.parse(atob(userParam));
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

                setStatus('success');

                // Auto-redirect to dashboard after 3 seconds
                setTimeout(() => {
                    window.location.href = '/student-dashboard';
                }, 3000);
            } catch {
                setStatus('error');
                setErrorMessage('Something went wrong processing your verification.');
            }
        } else {
            setStatus('error');
            setErrorMessage('Missing verification data.');
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-300">

                {status === 'loading' && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Verifying your email...</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-emerald-600" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Email Verified! 🎉</h2>
                        <p className="text-slate-500 mb-2">
                            Your account has been successfully verified. A welcome email with your profile details has been sent.
                        </p>
                        <p className="text-slate-400 text-sm mb-6">
                            Redirecting to your dashboard in a moment...
                        </p>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-6">
                            <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                        </div>
                        <Link
                            href="/student-dashboard"
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg"
                        >
                            Go to Dashboard Now
                        </Link>
                    </>
                )}

                {status === 'already_verified' && (
                    <>
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="text-blue-600" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Already Verified</h2>
                        <p className="text-slate-500 mb-6">
                            Your email has already been verified. You can log in to your account.
                        </p>
                        <Link
                            href="/student/login"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg"
                        >
                            Go to Login
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="text-red-600" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-red-800 mb-2">Verification Failed</h2>
                        <p className="text-slate-500 mb-6">{errorMessage}</p>
                        <Link
                            href="/student/login"
                            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg"
                        >
                            Go to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
