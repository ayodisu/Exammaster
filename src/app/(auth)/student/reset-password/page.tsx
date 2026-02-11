"use client";

import React, { useState, Suspense } from 'react';
import axios from 'axios';
import { apiUrl } from '@/config/api';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== passwordConfirmation) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setStatus('error');
            setMessage('Password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await axios.post(apiUrl('password/reset'), {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            setStatus('success');
            setMessage(res.data.message || 'Your password has been reset!');

            // Redirect to login after a short delay
            setTimeout(() => {
                router.push('/student/login');
            }, 3000);

        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || error.response?.data?.email?.[0] || 'Unable to reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="text-center p-8">
                <div className="mb-4 text-red-500 font-bold">Invalid Reset Link</div>
                <p className="text-slate-500 mb-6">This password reset link is invalid or incomplete.</p>
                <Link href="/student/forgot-password" className="text-blue-600 hover:underline">Request a new link</Link>
            </div>
        );
    }

    return (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="text-blue-600" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
                <p className="text-slate-500 mt-2">Create a new secure password for your account.</p>
            </div>

            {status === 'success' ? (
                <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-emerald-600" size={32} />
                    </div>
                    <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 mb-6">
                        <p className="font-bold mb-1">Success!</p>
                        <p className="text-sm">{message}</p>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Redirecting to login page...
                    </p>
                    <Link href="/student/login" className="text-blue-600 font-bold hover:underline">
                        Click here if not redirected
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {status === 'error' && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                            {message}
                        </div>
                    )}

                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="email" value={email} />

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 flex justify-center items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
                    </button>

                    <div className="mt-6 text-center">
                        <Link href="/student/login" className="text-slate-500 hover:text-slate-800 text-sm font-medium inline-flex items-center gap-1 transition-colors">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
