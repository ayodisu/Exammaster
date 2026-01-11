"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Plus, Trash2, BookOpen, Clock, Users, ChevronRight } from 'lucide-react';
import { Exam } from '@/types';

export default function ExaminerDashboard() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExams();
    }, []);

    const [studentCount, setStudentCount] = useState<number | string>('--');

    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const [resExams, resStudents] = await Promise.all([
                axios.get('http://localhost:8000/api/exams', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('http://localhost:8000/api/students', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            setExams(resExams.data);
            setStudentCount(resStudents.data.length);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExam = async (id: number) => {
        if(!confirm('Are you sure you want to delete this exam?')) return;
        // API call to delete (needs endpoint)
        setExams(prev => prev.filter(e => e.id !== id));
    };

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Examiner Dashboard</h1>
                    <p className="text-slate-500 mt-2">Manage your assessments and question banks.</p>
                </div>
                <Link 
                    href="/exams/create"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    <Plus size={20} /> Set New Exam
                </Link>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Active Exams</p>
                            <h3 className="text-2xl font-bold text-slate-800">{exams.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Candidates</p>
                            <h3 className="text-2xl font-bold text-slate-800">{studentCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Avg Duration</p>
                            <h3 className="text-2xl font-bold text-slate-800">--</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exam List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Managed Exams</h2>
                    <span className="text-sm text-slate-500">{exams.length} total</span>
                </div>
                
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Loading exams...</div>
                    ) : exams.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <BookOpen size={32} />
                            </div>
                            <p className="text-slate-500 mb-4">No exams created yet.</p>
                            <Link href="/exams/create" className="text-indigo-600 font-medium hover:underline">Create your first exam</Link>
                        </div>
                    ) : (
                        exams.map((exam: Exam) => (
                            <div key={exam.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                        EX
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{exam.title}</h3>
                                        <div className="flex gap-2 mt-1 text-xs text-slate-500">
                                            <span>{exam.duration_minutes} mins</span>
                                            <span>•</span>
                                            <span className="font-medium text-emerald-600">{exam.is_published ? 'Published' : 'Draft'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    {exam.stats && (
                                        <div className="flex gap-4 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 hidden md:flex">
                                            <div className="text-center px-2">
                                                <div className="font-bold text-slate-700">{exam.stats.attempts}</div>
                                                <div className="text-slate-400">Attempts</div>
                                            </div>
                                            <div className="w-px bg-slate-200"></div>
                                            <div className="text-center px-2">
                                                <div className="font-bold text-slate-700">{exam.stats.avg_score}%</div>
                                                <div className="text-slate-400">Avg</div>
                                            </div>
                                            <div className="w-px bg-slate-200"></div>
                                             <div className="text-center px-2">
                                                <div className="font-bold text-emerald-600">{exam.stats.pass_rate}</div>
                                                <div className="text-slate-400">Pass Rate</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-400 hidden sm:inline">ID: {exam.id}</span>
                                        <button 
                                            onClick={() => handleDeleteExam(exam.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Exam"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <Link href={`/exams/${exam.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <ChevronRight size={18} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
