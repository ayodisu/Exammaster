"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, BookOpen, BrainCircuit, Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
// import { generateExam } from '@/services/geminiService'; // TODO: Move to API route

import AlertModal from '@/components/ui/AlertModal';

export default function CreateExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledDate = searchParams.get('date');

    const [topic, setTopic] = useState('');
    const [examType, setExamType] = useState<'exam' | 'mock' | 'test'>('exam');
    const [scheduledDate, setScheduledDate] = useState(prefilledDate ? `${prefilledDate}T09:00` : '');
    const [questionCount, setQuestionCount] = useState(5);
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
            await new Promise(r => setTimeout(r, 1500));
            const newExam = {
                title: `${topic} ${examType === 'mock' ? 'Mock' : 'Exam'}`,
                duration_minutes: questionCount * 2,
                type: examType,
                scheduled_at: scheduledDate || null,
                questions: Array(questionCount).fill(null).map((_, i) => ({
                    text: `Sample Question ${i+1} about ${topic}`,
                    type: 'mcq',
                    options: ['A', 'B', 'C', 'D'],
                    correct_answer: 'A'
                }))
            };

            // Save to Backend
            await axios.post('http://localhost:8000/api/exams', newExam, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            setAlertState({
                isOpen: true,
                title: 'Success!',
                message: 'Exam created successfully. Redirecting...',
                type: 'success'
            });

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } catch (error: any) {
            console.error('Creation error:', error);
            const msg = error.response?.data?.message || "Failed to create exam. Please ensure all inputs are valid.";
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
                <h3 className="text-2xl font-bold text-slate-800">Generating Assessment...</h3>
                <p className="text-slate-500 mt-2">Creating {examType} about &quot;{topic}&quot;</p>
            </div>
        );
    }

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
                     <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium mb-6">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit className="text-indigo-600"/> Create New Assessment
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
                                    onChange={(e) => setExamType(e.target.value as any)}
                                >
                                    <option value="exam">Standard Exam</option>
                                    <option value="mock">Mock Exam</option>
                                    <option value="test">Quick Test</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Number of Questions</label>
                            <input 
                                type="number" 
                                min={3} 
                                max={50}
                                value={questionCount}
                                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-2">Scheduled Date (Optional)</label>
                         <input 
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                         />
                         <p className="text-xs text-slate-400 mt-1">Leave blank to make it available immediately.</p>
                    </div>

                    <div className="flex items-center gap-3 mt-8 pt-4 border-t border-slate-100">
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleCreate}
                            disabled={!topic}
                            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                        >
                            Generate Exam
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
