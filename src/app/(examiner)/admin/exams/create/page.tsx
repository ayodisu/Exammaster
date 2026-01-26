"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, BookOpen, BrainCircuit, Layers, ArrowLeft, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
// import { generateExam } from '@/services/geminiService'; // TODO: Move to API route

import AlertModal from '@/components/ui/AlertModal';

export default function CreateExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledDate = searchParams.get('date');
    const returnTo = searchParams.get('returnTo');

    const [topic, setTopic] = useState('');
    const [examType, setExamType] = useState<'exam' | 'mock' | 'test'>('exam');
    const [datePart, setDatePart] = useState(prefilledDate || '');
    const [timePart, setTimePart] = useState('09:00');
    const [duration, setDuration] = useState(60);
    const [isLoading, setIsLoading] = useState(false);

    // Alert State
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const handleCreate = async () => {
        if (!topic) return;
        setIsLoading(true);
        try {
            // Mock Generation...
            await new Promise(r => setTimeout(r, 1000));
            const newExam = {
                title: `${topic} ${examType === 'mock' ? 'Mock' : 'Exam'}`,
                duration_minutes: duration,
                type: examType,
                scheduled_at: (datePart && timePart) ? `${datePart}T${timePart}` : null,
                questions: [] // No sample questions
            };

            // Save to Backend
            const res = await axios.post(apiUrl('assessments'), newExam, {
                headers: getAuthHeaders()
            });
            const createdExam = res.data;

            setAlertState({
                isOpen: true,
                title: 'Success!',
                message: 'Assessment created successfully. Redirecting to setup...',
                type: 'success'
            });

            setTimeout(() => {
                // Redirect to the Exam Details / Edit Page explicitly
                // This allows examiner to add questions and activate immediately.
                router.push(`/admin/exams/${createdExam.id}`);
            }, 1000);

        } catch (error: unknown) {
            console.error('Creation error:', error);
            let msg = "Failed to create assessment. Please ensure all inputs are valid.";
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosErr = error as { response?: { data?: { message?: string } } };
                msg = axiosErr.response?.data?.message || msg;
            }
            setAlertState({
                isOpen: true,
                title: 'Creation Failed',
                message: msg,
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ... loading state ...

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 animate-in fade-in">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                <h3 className="text-2xl font-bold text-slate-800">Creating Assessment...</h3>
                <p className="text-slate-500 mt-2">Setting up {examType} about &quot;{topic}&quot;</p>
            </div>
        );
    }

    const getBackUrl = () => {
        if (returnTo === 'calendar') return '/admin/calendar';
        if (returnTo === 'assessments') return '/admin/exams';
        return '/dashboard';
    };
    const backUrl = getBackUrl();

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                {/* ... Header ... */}
                <div className="mb-8">
                    <Link href={backUrl} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium mb-6">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit className="text-indigo-600" /> Create New Assessment
                    </h2>
                    <p className="text-slate-500 mt-1">Configure the details for the new assessment.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Topic or Subject</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="e.g. History of Rome, Javascript Basics"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Assessment Type</label>
                            <div className="relative">
                                <Layers className="absolute left-3 top-3.5 text-slate-400" size={20} />
                                <select
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value as 'exam' | 'mock' | 'test')}
                                >
                                    <option value="exam">Standard Exam</option>
                                    <option value="mock">Mock Exam</option>
                                    <option value="test">Quick Test</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Duration (Minutes)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                                <input
                                    type="number"
                                    min={10}
                                    max={300}
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Schedule (Optional)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                                        <Calendar size={20} />
                                    </div>
                                    <input
                                        type="date"
                                        value={datePart}
                                        onChange={(e) => setDatePart(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors hover:border-indigo-300"
                                        onClick={(e) => e.currentTarget.showPicker()}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Time</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                                        <Clock size={20} />
                                    </div>
                                    <input
                                        type="time"
                                        value={timePart}
                                        onChange={(e) => setTimePart(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors hover:border-indigo-300"
                                        onClick={(e) => e.currentTarget.showPicker()}
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Leave date blank to make it available immediately.</p>
                    </div>

                    <div className="flex items-center gap-3 mt-8 pt-4 border-t border-slate-100">
                        <Link
                            href={backUrl}
                            className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleCreate}
                            disabled={!topic}
                            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                        >
                            Create Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
