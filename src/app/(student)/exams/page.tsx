"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { Exam, User, Attempt } from '@/types';
import { STORAGE_KEYS } from '@/config/constants';
import Link from 'next/link';
import { Clock, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CurrentTime from '@/components/CurrentTime';

export default function StudentExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [results, setResults] = useState<Attempt[]>([]);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
            router.push('/');
            return;
        }
        const headers = getAuthHeaders();

        const fetchInitialData = async () => {
            try {
                const [resExams, resUser, resAttempts] = await Promise.all([
                    axios.get(apiUrl('assessments'), { headers }),
                    axios.get(apiUrl('user'), { headers }),
                    axios.get(apiUrl('attempts'), { headers })
                ]);

                setExams(resExams.data);
                setUser(resUser.data);
                setResults(resAttempts.data);
            } catch (err) {
                console.error("Initial load failed", err);
                router.push('/');
            }
        };

        const fetchUpdates = async () => {
            try {
                const res = await axios.get(apiUrl('assessments'), { headers });
                setExams(res.data);
            } catch (err: unknown) {
                console.error("Polling failed", err);
                if (err instanceof Error && 'response' in err) {
                    const axiosErr = err as { response?: { status?: number } };
                    if (axiosErr.response?.status === 401) {
                        router.push('/');
                    }
                }
            }
        };

        fetchInitialData();
        const intervalId = setInterval(fetchUpdates, 10000);
        return () => clearInterval(intervalId);
    }, [router]);

    if (!user) return <div className="p-8 text-center">Loading assessments...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">Assessment Repository</span>
                    <h1 className="text-3xl font-bold text-slate-800 mt-2">All Assessments</h1>
                    <p className="text-slate-500">View all active and archival assessments.</p>
                </div>
                <CurrentTime />
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-slate-400" size={20} /> Assessment List
                    </h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {exams.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No assessments found in the system.
                        </div>
                    ) : (
                        exams.map((exam: Exam) => {
                            const completedAttempt = results.find(r => r.exam_id === exam.id);
                            const isCompleted = !!completedAttempt;

                            return (
                                <div key={exam.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors ${!exam.is_active ? 'opacity-75' : ''}`}>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-slate-800 text-lg">{exam.title}</h3>
                                            {isCompleted && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                    Completed
                                                </span>
                                            )}
                                            {!exam.is_active && (
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                                                    Ended
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-3 mt-2 text-sm font-medium text-slate-500">
                                            <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] tracking-wider ${exam.type === 'mock' ? 'bg-amber-100 text-amber-700' :
                                                    exam.type === 'test' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {exam.type}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Clock size={12} /> {exam.duration_minutes} Mins
                                            </span>
                                            {isCompleted && completedAttempt && (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Award size={12} /> Score: {completedAttempt.score || 0}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div>
                                        {(() => {
                                            const isRetakeAllowed = isCompleted && exam.type === 'mock' && exam.is_active;
                                            const canStart = !isCompleted && exam.is_active;

                                            if (canStart) {
                                                return (
                                                    <Link href={`/exam/${exam.id}`}>
                                                        <button className="px-6 py-2 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95">
                                                            Start Assessment
                                                        </button>
                                                    </Link>
                                                );
                                            } else if (isRetakeAllowed) {
                                                return (
                                                    <Link href={`/exam/${exam.id}`}>
                                                        <button className="px-6 py-2 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 transition-all hover:scale-105 active:scale-95">
                                                            Retake Mock
                                                        </button>
                                                    </Link>
                                                );
                                            } else {
                                                return (
                                                    <button disabled className="px-6 py-2 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200">
                                                        {isCompleted ? 'View Results' : 'Not Available'}
                                                    </button>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
