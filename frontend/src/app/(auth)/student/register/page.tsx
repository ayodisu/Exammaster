"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CandidateRegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:8000/api/candidate/register', formData);
            localStorage.setItem('token', res.data.token);
            alert(`Registration Successful! Your Exam Number is: ${res.data.user.exam_number}`);
            router.push('/exams');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Registration failed.');
                if (err.response.data.errors) {
                    setError(Object.values(err.response.data.errors).flat().join(' '));
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
             <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Side Info */}
                <div className="bg-blue-600 p-8 md:p-12 text-white md:w-1/3 flex flex-col justify-between">
                    <div>
                         <Link href="/" className="text-blue-200 hover:text-white flex items-center gap-1 text-sm font-medium mb-8">
                            <ArrowLeft size={16} /> Back
                        </Link>
                        <h2 className="text-3xl font-bold mb-4">Join ExamMaster</h2>
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
                            <input name="first_name" required onChange={handleChange} className="input-field" placeholder="John" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                            <input name="last_name" required onChange={handleChange} className="input-field" placeholder="Doe" />
                        </div>

                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input name="email" type="email" required onChange={handleChange} className="input-field" placeholder="john@example.com" />
                        </div>

                        <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <input name="phone_number" required onChange={handleChange} className="input-field" placeholder="+1234567890" />
                        </div>
                         <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                            <input name="date_of_birth" type="date" onChange={handleChange} className="input-field" />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                            <select name="gender" onChange={handleChange} className="input-field bg-white">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Create Password</label>
                            <input name="password" type="password" required onChange={handleChange} className="input-field" placeholder="••••••••" />
                        </div>
                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                            <input name="password_confirmation" type="password" required onChange={handleChange} className="input-field" placeholder="••••••••" />
                        </div>

                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                            <textarea name="address" required onChange={handleChange} className="input-field min-h-[80px]" placeholder="123 Main St, City"></textarea>
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
    );
}
