"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '@/config/api';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await axios.post(apiUrl('password/email'), { email });
            setStatus('success');
            setMessage(res.data.message || 'We have emailed your password reset link.');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || error.response?.data?.email?.[0] || 'Unable to send reset link. Please check your email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Forgot Password?</h1>
                    <p className="text-slate-500 mt-2">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center">
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 mb-6 flex items-center gap-3">
                            <CheckCircle className="shrink-0" size={20} />
                            <p className="text-sm font-medium text-left">{message}</p>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Check your email for the link. If you don't see it, check your spam folder.
                        </p>
                        <Link href="/student/login" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-2">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {status === 'error' && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                {message}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                placeholder="john@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                        </button>

                        <div className="mt-6 text-center">
                            <Link href="/student/login" className="text-slate-500 hover:text-slate-800 text-sm font-medium inline-flex items-center gap-1 transition-colors">
                                <ArrowLeft size={16} /> Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
