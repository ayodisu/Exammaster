"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Exam, User, Attempt } from '@/types';
import Link from 'next/link';
import { GraduationCap, Clock, Award, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [results, setResults] = useState<Attempt[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [resExams, resUser, resAttempts] = await Promise.all([
                    axios.get('http://localhost:8000/api/exams', { headers }),
                    axios.get('http://localhost:8000/api/user', { headers }),
                    axios.get('http://localhost:8000/api/attempts', { headers })
                ]);
                
                setExams(resExams.data);
                setUser(resUser.data);
                setResults(resAttempts.data);
            } catch (err) {
                console.error(err);
                router.push('/login');
            }
        };
        fetchData();
    }, [router]);

    if (!user) return <div className="p-8 text-center">Loading dashboard...</div>;

    const averageScore = results.length > 0
        ? Math.round(results.reduce((acc, curr) => acc + (curr.score || 0), 0) / results.length)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8 animate-in fade-in duration-500">
            <header>
                <div className="flex items-center gap-3 mb-2">
                     <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">Candidate Portal</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-800">Welcome, {user.name}</h1>
                <p className="text-slate-500 mt-2">Select an exam below to begin your assessment.</p>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Exams Completed</p>
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
                            <p className="text-slate-500 text-sm font-medium">Pending Exams</p>
                            <h3 className="text-2xl font-bold text-slate-800">{Math.max(0, exams.length - results.length)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Exams */}
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock className="text-slate-400" size={20}/> Available Assessments
                    </h2>
                    <div className="space-y-3">
                        {exams.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No exams available at the moment.</p>
                                <p className="text-xs text-slate-400 mt-1">Please check back later.</p>
                            </div>
                        ) : (
                            exams.map((exam: Exam) => {
                                const completedAttempt = results.find(r => r.exam_id === exam.id);
                                const isCompleted = !!completedAttempt;

                                return (
                                    <div key={exam.id} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-800">{exam.title}</h3>
                                                {isCompleted && (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-3 mt-1 text-xs font-medium text-slate-500">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded">General</span>
                                                <span className="bg-slate-100 px-2 py-0.5 rounded">{exam.duration_minutes} Mins</span>
                                                {isCompleted && completedAttempt && (
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                        Score: {completedAttempt.score || 0}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Link href={`/exam/${exam.id}`}>
                                            <button className={`px-4 py-2 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 ${
                                                isCompleted 
                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}>
                                                {isCompleted ? 'Retake' : 'Start'}
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Results */}
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Award className="text-slate-400" size={20}/> Your Performance
                    </h2>
                    <div className="space-y-3">
                        {results.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No exams taken yet.</p>
                            </div>
                        ) : (
                            results.map(result => (
                                <div key={result.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{result.exam?.title || `Exam #${result.exam_id}`}</h3>
                                        <p className="text-xs text-slate-400 mt-1">{result.status} • {new Date(result.started_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-emerald-600">
                                            {result.score || 0}%
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
