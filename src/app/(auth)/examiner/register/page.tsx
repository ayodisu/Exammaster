"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl, APP_NAME } from '@/config/api';
import { STORAGE_KEYS } from '@/config/constants';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function ExaminerRegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password || !passwordConfirmation) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await axios.post(apiUrl('examiner/register'), {
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
            router.push('/dashboard');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 422 && err.response.data.errors) {
                    setError(Object.values(err.response.data.errors).flat().join(' '));
                } else {
                    setError(err.response.data.message || 'Registration failed.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                <Link href="/examiner/login" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium mb-8">
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Create Examiner Account</h1>
                    <p className="text-slate-500 mt-2">Set up your account to manage exams.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 8 chars, mixed case, numbers, symbols"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            placeholder="Re-enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 flex justify-center items-center mt-4"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link href="/examiner/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="absolute bottom-8 text-slate-600 text-xs">
                Restricted Access Area • {APP_NAME}
            </div>
        </div>
    );
}
