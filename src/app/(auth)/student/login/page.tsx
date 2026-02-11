"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '@/config/api';
import { STORAGE_KEYS } from '@/config/constants';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CandidateLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailNotVerified, setEmailNotVerified] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setError('');
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        setEmailNotVerified(false);

        try {
            const res = await axios.post(apiUrl('candidate/login'), {
                email,
                password
            });
            localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
            router.push('/student-dashboard');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.data.email_not_verified) {
                    setEmailNotVerified(true);
                    setUnverifiedEmail(err.response.data.email || email);
                } else if (err.response.status === 422 && err.response.data.errors) {
                    setError(Object.values(err.response.data.errors).flat().join(' '));
                } else {
                    setError(err.response.data.message || 'Login failed. Please check your credentials.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setResending(true);
        setResendMessage('');
        try {
            const res = await axios.post(apiUrl('email/resend'), { email: unverifiedEmail });
            setResendMessage(res.data.message || 'Verification link sent!');
        } catch {
            setResendMessage('Failed to resend. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Side - Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 animate-in slide-in-from-left duration-500">
                <div className="mb-8">
                    <Link href="/" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium mb-6">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <LogIn size={24} />
                        </div>
                        <span className="font-bold text-blue-600 tracking-wider text-sm uppercase">Candidate Portal</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
                    <p className="text-slate-500 mt-2">Enter your exam number or email to continue your assessment.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 max-w-md">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    {emailNotVerified && (
                        <div className="p-4 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-200 animate-in fade-in">
                            <div className="flex items-center gap-2 mb-2">
                                <Mail size={18} className="text-amber-600" />
                                <span className="font-bold">Email Not Verified</span>
                            </div>
                            <p className="mb-3">Please verify your email address before logging in. Check your inbox for the verification link.</p>

                            {resendMessage && (
                                <div className="mb-3 p-2 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2 text-xs">
                                    <CheckCircle size={14} />
                                    {resendMessage}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resending}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2"
                            >
                                {resending ? <Loader2 className="animate-spin" size={14} /> : null}
                                Resend Verification Email
                            </button>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="student@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-600">Remember me</span>
                        </label>
                        <Link href="/student/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200 flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                    </button>

                    <p className="text-center text-slate-500 text-sm mt-4">
                        Don&apos;t have an account? <Link href="/student/register" className="text-blue-600 font-bold hover:underline">Register now</Link>
                    </p>
                </form>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden md:flex w-1/2 bg-slate-50 items-center justify-center p-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 mix-blend-multiply"></div>
                <div className="max-w-md text-center relative z-10">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 rotate-12">
                        <span className="text-4xl">🎓</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Secure & Reliable Testing</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Access your exams in a controlled environment designed for fairness and performance.
                    </p>
                </div>
            </div>
        </div>
    );
}
