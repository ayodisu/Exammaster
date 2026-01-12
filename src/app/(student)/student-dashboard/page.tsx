"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { STORAGE_KEYS } from '@/config/constants';
import { Exam, User, Attempt } from '@/types';
import Link from 'next/link';
import { GraduationCap, Clock, Award, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CurrentTime from '@/components/CurrentTime';

export default function StudentDashboard() {
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

    if (!user) return <div className="p-8 text-center">Loading dashboard...</div>;

    const averageScore = results.length > 0
        ? Math.round(results.reduce((acc, curr) => acc + (curr.score || 0), 0) / results.length)
        : 0;

    const pendingExamsCount = exams.filter(e => e.is_active && !results.some(r => r.exam_id === e.id)).length;

    // Filter available and upcoming assessments
    // Include: Active exams not yet taken (or mock), OR scheduled exams
    const availableAssessments = exams.filter(exam => {
        const hasTaken = results.some(r => r.exam_id === exam.id);

        // If already taken, only allow retaking if it is a mock exam AND it is active
        if (hasTaken) {
            return exam.type === 'mock' && exam.is_active;
        }

        // Show scheduled (future) exams
        if (exam.is_scheduled) return true;

        // Show active exams
        if (exam.is_active) return true;

        return false;
    }).sort((a, b) => {
        // Sort active exams to top
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return 0;
    });

    const recentResults = [...results]
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .slice(0, 3);



    // Filter due exams for marquee (not mock, active or scheduled for today)
    const dueExams = exams.filter(exam => {
        if (exam.type === 'mock') return false;
        if (exam.is_active) return true;
        if (exam.scheduled_at) {
            const examDate = new Date(exam.scheduled_at);
            const today = new Date();
            return examDate.toDateString() === today.toDateString();
        }
        return false;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8 animate-in fade-in duration-500">
            {/* Alert Slider CSS */}
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .marquee-container:hover .animate-marquee {
                    animation-play-state: paused;
                }
            `}</style>

            {/* Due Assessment Slider */}
            {dueExams.length > 0 && (
                <div className="w-full bg-amber-50 border-l-4 border-amber-500 overflow-hidden relative py-3 shadow-sm rounded-r-xl marquee-container group cursor-default">
                    <div className="animate-marquee whitespace-nowrap flex gap-16 items-center text-amber-800 px-4 font-bold text-sm">
                        {dueExams.map(exam => (
                            <span key={exam.id} className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-amber-600" />
                                <span className="uppercase tracking-wide text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Action Required</span>
                                Assessment Due: <span className="text-amber-900 underline decoration-amber-500/50">{exam.title}</span> is {exam.is_active ? 'currently ACTIVE' : `scheduled for TODAY at ${new Date(exam.scheduled_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">Candidate Portal</span>
                        {user.exam_number && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold font-mono tracking-wide">
                                ID: {user.exam_number}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Hello, {user.first_name || user.name}</h1>
                    <p className="text-slate-500 mt-2">Welcome back to your dashboard.</p>
                </div>
                <CurrentTime />
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Assessments Completed</p>
                            <h3 className="text-2xl font-bold text-slate-800">{results.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Average Score</p>
                            <h3 className="text-2xl font-bold text-slate-800">{averageScore}%</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Pending Assessments</p>
                            <h3 className="text-2xl font-bold text-slate-800">{pendingExamsCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Assessments */}
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock className="text-slate-400" size={20} /> Available Assessments
                    </h2>
                    <div className="space-y-3">
                        {availableAssessments.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No active assessments pending.</p>
                                <Link href="/exams" className="text-blue-600 hover:underline text-sm mt-2 inline-block">View all assessments</Link>
                            </div>
                        ) : (
                            availableAssessments.map((exam: Exam) => {
                                const completedAttempt = results.find(r => r.exam_id === exam.id);
                                const isCompleted = !!completedAttempt;
                                const isScheduled = exam.is_scheduled;
                                const scheduledTime = exam.scheduled_time;
                                const isActiveNow = exam.is_active && !isScheduled;

                                return (
                                    <div key={exam.id} className={`group p-5 rounded-2xl border transition-all flex justify-between items-center 
                                        ${isActiveNow
                                            ? 'bg-indigo-50/50 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-400/50'
                                            : isScheduled
                                                ? 'bg-amber-50/30 border-amber-200 shadow-sm'
                                                : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                                        }`}>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-slate-800">{exam.title}</h3>
                                                {isActiveNow && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Live
                                                    </span>
                                                )}
                                                {isScheduled && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                                        Scheduled
                                                    </span>
                                                )}
                                                {isCompleted && (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-3 mt-1 text-xs font-medium text-slate-500 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] tracking-wider ${exam.type === 'mock' ? 'bg-amber-100 text-amber-700' :
                                                    exam.type === 'test' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {exam.type}
                                                </span>
                                                <span className="bg-slate-100 px-2 py-0.5 rounded">{exam.duration_minutes} Mins</span>
                                                {isScheduled && scheduledTime && (
                                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(scheduledTime).toLocaleDateString()} &bull; {new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(new Date(scheduledTime).getTime() + exam.duration_minutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Button Logic */}
                                        {(isScheduled && (!scheduledTime || new Date() < new Date(scheduledTime))) ? (
                                            <button
                                                disabled
                                                className="px-4 py-2 rounded-full font-bold text-sm bg-slate-200 text-slate-500 cursor-not-allowed"
                                            >
                                                Not Yet
                                            </button>
                                        ) : (
                                            <Link href={`/exam/${exam.id}`}>
                                                <button className={`px-4 py-2 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 text-white ${isCompleted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                                    {isCompleted ? 'Retake' : 'Start'}
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Results */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Award className="text-slate-400" size={20} /> Your Performance
                        </h2>
                        <Link href="/results" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            See all <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentResults.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No exams taken yet.</p>
                            </div>
                        ) : (
                            recentResults.map(result => (
                                <div key={result.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{result.exam?.title || `Exam #${result.exam_id}`}</h3>
                                        <p className="text-xs text-slate-400 mt-1">{result.status} • {new Date(result.started_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className={`text-lg font-bold ${(result.score || 0) >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {result.score || 0}%
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(result.score || 0) >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {(result.score || 0) >= 50 ? 'Passed' : 'Failed'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
