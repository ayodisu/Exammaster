"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl, APP_NAME } from '@/config/api';

import { Loader2, UserPlus, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CandidateRegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone_number: '',
        date_of_birth: '',
        gender: 'male',
        address: ''
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errors: Record<string, string> = {};

        if (formData.first_name.length < 2) errors.first_name = 'First name must be at least 2 characters.';
        if (!/^[a-zA-Z\s\-']+$/.test(formData.first_name)) errors.first_name = 'First name contains invalid characters.';

        if (formData.last_name.length < 2) errors.last_name = 'Last name must be at least 2 characters.';
        if (!/^[a-zA-Z\s\-']+$/.test(formData.last_name)) errors.last_name = 'Last name contains invalid characters.';

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address.';

        if (formData.phone_number && !/^[\+]?[0-9]{7,15}$/.test(formData.phone_number)) {
            errors.phone_number = 'Enter a valid phone number (7-15 digits, optional +).';
        } else if (!formData.phone_number) {
            errors.phone_number = 'Phone number is required.';
        }

        if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters.';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(formData.password)) {
            errors.password = 'Password must contain uppercase, number, and symbol.';
        }

        if (formData.password !== formData.password_confirmation) {
            errors.password_confirmation = 'Passwords do not match.';
        }

        if (formData.address.length < 5) errors.address = 'Please enter a more detailed address.';

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        setError('');

        try {
            await axios.post(apiUrl('candidate/register'), formData);
            setRegisteredEmail(formData.email);
            setRegistrationComplete(true);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    if (err.response.status === 422 && err.response.data.errors) {
                        const backendErrors: Record<string, string> = {};
                        Object.entries(err.response.data.errors).forEach(([key, val]) => {
                            backendErrors[key] = (val as string[])[0];
                        });
                        setFieldErrors(backendErrors);
                    } else {
                        setError(err.response.data.message || 'Registration failed.');
                    }
                } else {
                    setError(err.message || 'Network Error: Unable to connect to server.');
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
            const res = await axios.post(apiUrl('email/resend'), { email: registeredEmail });
            setResendMessage(res.data.message || 'Verification link sent!');
        } catch {
            setResendMessage('Failed to resend. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            {/* Success Modal Overlay */}
            {registrationComplete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="text-emerald-600" size={36} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Your Email</h2>
                            <p className="text-slate-500 mb-1">
                                We&apos;ve sent a verification link to:
                            </p>
                            <p className="font-semibold text-slate-800 text-lg mb-4">{registeredEmail}</p>
                            <p className="text-slate-500 text-sm mb-6">
                                Click the link in the email to verify your account. The link expires in <strong>60 minutes</strong>.
                            </p>

                            {resendMessage && (
                                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-100 flex items-center gap-2 justify-center">
                                    <CheckCircle size={16} />
                                    {resendMessage}
                                </div>
                            )}

                            <button
                                onClick={handleResendVerification}
                                disabled={resending}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-all mb-3 flex items-center justify-center gap-2"
                            >
                                {resending ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                                Resend Verification Email
                            </button>

                            <Link
                                href="/student/login"
                                className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline text-sm"
                            >
                                Go to Login <ArrowLeft size={14} className="rotate-180" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                    {/* Side Info */}
                    <div className="bg-blue-600 p-8 md:p-12 text-white md:w-1/3 flex flex-col justify-between">
                        <div>
                            <Link href="/" className="text-blue-200 hover:text-white flex items-center gap-1 text-sm font-medium mb-8">
                                <ArrowLeft size={16} /> Back
                            </Link>
                            <h2 className="text-3xl font-bold mb-4">Join {APP_NAME}</h2>
                            <p className="text-blue-100">Create your candidate profile to start taking assessments. Your data is secure and used only for examination purposes.</p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-8 md:p-12 md:w-2/3">
                        <div className="flex items-center gap-2 mb-6">
                            <UserPlus className="text-blue-600" size={24} />
                            <h1 className="text-2xl font-bold text-slate-900">Candidate Registration</h1>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                <input
                                    name="first_name"
                                    required
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className={`input-field ${fieldErrors.first_name ? 'border-red-500 ring-red-100 ring-4' : ''}`}
                                    placeholder="John"
                                />
                                {fieldErrors.first_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.first_name}</p>}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                <input
                                    name="last_name"
                                    required
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className={`input-field ${fieldErrors.last_name ? 'border-red-500 ring-red-100 ring-4' : ''}`}
                                    placeholder="Doe"
                                />
                                {fieldErrors.last_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.last_name}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input-field ${fieldErrors.email ? 'border-red-500 ring-red-100 ring-4' : ''}`}
                                    placeholder="john@example.com"
                                />
                                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input
                                    name="phone_number"
                                    type="tel"
                                    required
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    className={`input-field ${fieldErrors.phone_number ? 'border-red-500 ring-red-100 ring-4' : ''}`}
                                    placeholder="+1234567890"
                                />
                                {fieldErrors.phone_number && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone_number}</p>}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                <input
                                    name="date_of_birth"
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    className={`input-field ${fieldErrors.date_of_birth ? 'border-red-500 ring-red-100 ring-4' : ''}`}
                                />
                                {fieldErrors.date_of_birth && <p className="text-red-500 text-xs mt-1">{fieldErrors.date_of_birth}</p>}
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="input-field bg-white"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Create Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input-field ${fieldErrors.password ? 'border-red-500 ring-red-100 ring-4' : ''}`}
                                    placeholder="••••••••"
                                />
                                {fieldErrors.password ? (
                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                                ) : (
                                    <p className="text-xs text-slate-500 mt-1">Must be at least 8 chars, with uppercase, number & symbol.</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                <input
                                    name="password_confirmation"
                                    type="password"
                                    required
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className={`input-field ${fieldErrors.password_confirmation ? 'border-red-500 ring-red-100 ring-4' : ''}`}
                                    placeholder="••••••••"
                                />
                                {fieldErrors.password_confirmation && <p className="text-red-500 text-xs mt-1">{fieldErrors.password_confirmation}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    className={`input-field min-h-[80px] ${fieldErrors.address ? 'border-red-500 ring-red-100 ring-4' : ''}`}
                                    placeholder="123 Main St, City"
                                ></textarea>
                                {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
                            </div>

                            <div className="md:col-span-2 mt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center items-center"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                                </button>
                            </div>
                        </form>
                        <p className="text-center text-slate-500 text-sm mt-4 md:col-span-2">
                            Already have an account? <Link href="/student/login" className="text-blue-600 font-bold hover:underline">Login here</Link>
                        </p>
                    </div>
                </div>
                <style jsx>{`
                .input-field {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    background-color: #ffffff;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
             `}</style>
            </div>
        </>
    );
}
