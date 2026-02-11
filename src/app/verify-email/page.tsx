"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const verificationUrl = searchParams.get('url');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        if (!verificationUrl) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                // The backend URL is already a full URL with signature
                const res = await axios.get(verificationUrl);

                setStatus('success');
                setMessage(res.data.message || 'Email verified successfully! You can now log in.');

                // Auto-login if token is present
                if (res.data.token && res.data.user) {
                    localStorage.setItem('token', res.data.token);
                    localStorage.setItem('user', JSON.stringify(res.data.user));

                    // Redirect to dashboard after a delay
                    setTimeout(() => {
                        router.push('/student-dashboard');
                    }, 2000);
                } else if (res.data.already_verified) {
                    // If no token returned but already verified, redirect to login
                    setTimeout(() => {
                        router.push('/student/login');
                    }, 2000);
                }

            } catch (error: any) {
                // If it's already verified but returned an error status (fallback)
                if (error.response?.data?.already_verified) {
                    setStatus('success');
                    setMessage('Email already verified. Redirecting...');
                    setTimeout(() => {
                        router.push('/student/login');
                    }, 2000);
                    return;
                }

                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
            }
        };

        verify();
    }, [verificationUrl, router]);

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            {status === 'verifying' && (
                <>
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="text-blue-600 animate-spin" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying Email</h2>
                    <p className="text-slate-500">{message}</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-emerald-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verified!</h2>
                    <p className="text-slate-500 mb-6">{message}</p>
                    <Link
                        href="/student/login"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full justify-center"
                    >
                        Continue to Login <ArrowRight size={18} />
                    </Link>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification Failed</h2>
                    <p className="text-slate-500 mb-6">{message}</p>
                    <Link
                        href="/student/login"
                        className="text-slate-600 hover:text-slate-800 font-medium hover:underline"
                    >
                        Back to Login
                    </Link>
                </>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
