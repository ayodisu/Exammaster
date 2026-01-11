"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Plus, Trash2, BookOpen, Clock, Users, ChevronRight, Power, Loader2 } from 'lucide-react';
import { Exam } from '@/types';
import CurrentTime from '@/components/CurrentTime';

import AlertModal from '@/components/ui/AlertModal';

export default function ExaminerDashboard() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [successMsg, setSuccessMsg] = useState<{id: number, text: string} | null>(null);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; onConfirm?: () => void; confirmText?: string; }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const [stats, setStats] = useState({ total_students: 0, avg_duration: '--' });

    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [resExams, resStats] = await Promise.all([
                axios.get('http://localhost:8000/api/exams', { headers }),
                axios.get('http://localhost:8000/api/exams/stats/overview', { headers })
            ]);
            
            setExams(resExams.data);
            setStats(resStats.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: number) => {
        if (togglingId === id) return; // Prevent double click
        setTogglingId(id);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8000/api/exams/${id}/status`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setExams(prev => prev.map(e => {
                if (e.id === id) {
                    const newStatus = !e.is_active;
                    setSuccessMsg({ id, text: newStatus ? "Exam Activated" : "Exam Ended" });
                    setTimeout(() => setSuccessMsg(null), 3000);
                    return { ...e, is_active: newStatus };
                }
                return e;
            }));
        } catch (error: any) {
            console.error('Failed to update status', error);
            const msg = error.response?.data?.message || "Failed to update exam status. Please try again.";
            setAlertState({
                isOpen: true,
                title: 'Update Failed',
                message: msg,
                type: 'error'
            });
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteExam = async (id: number) => {
        setAlertState({
            isOpen: true,
            title: 'Delete Exam?',
            message: 'Are you sure you want to delete this exam? This action cannot be undone.',
            type: 'warning',
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                setAlertState(prev => ({ ...prev, isOpen: false }));
                try {
                    const token = localStorage.getItem('token');
                    await axios.delete(`http://localhost:8000/api/exams/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setExams(prev => prev.filter(e => e.id !== id));
                    setAlertState({ isOpen: true, title: 'Deleted', message: 'Exam deleted successfully.', type: 'success' });
                } catch (error: any) {
                    const msg = error.response?.data?.message || "Failed to delete exam.";
                    setAlertState({ isOpen: true, title: 'Error', message: msg, type: 'error' });
                }
            }
        });
    };

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
             <AlertModal 
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onConfirm={alertState.onConfirm}
                confirmText={alertState.confirmText}
            />
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                     <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide">Examiner Portal</span>
                    <h1 className="text-3xl font-bold text-slate-800 mt-2">Dashboard</h1>
                    <p className="text-slate-500">Manage exams and view student performance.</p>
                </div>
                <div className="flex items-center gap-4">
                    <CurrentTime />
                    <Link 
                        href="/admin/exams/create"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Plus size={20} /> Set New Exam
                    </Link>
                </div>
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
                            <h3 className="text-2xl font-bold text-slate-800">{stats.total_students}</h3>
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
                            <h3 className="text-2xl font-bold text-slate-800">{stats.avg_duration}</h3>
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
                            <Link href="/admin/exams/create" className="text-indigo-600 font-medium hover:underline">Create your first exam</Link>
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
                                        
                                        {/* Success Message */}
                                        {successMsg?.id === exam.id && (
                                            <span className="text-xs font-bold text-emerald-600 animate-in fade-in slide-in-from-right-2">
                                                {successMsg.text}
                                            </span>
                                        )}

                                        <button 
                                            onClick={() => handleToggleStatus(exam.id)}
                                            disabled={togglingId === exam.id}
                                            className={`p-2 rounded-lg transition-colors ${
                                                exam.is_active 
                                                    ? 'text-emerald-600 hover:bg-emerald-50' 
                                                    : 'text-slate-400 hover:bg-slate-100'
                                            } ${togglingId === exam.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={exam.is_active ? "End Exam" : "Activate Exam"}
                                        >
                                            {togglingId === exam.id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Power size={18} />
                                            )}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteExam(exam.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Exam"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <Link href={`/admin/exams/${exam.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
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
