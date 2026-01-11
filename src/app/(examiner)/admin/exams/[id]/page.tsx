"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Exam, Attempt } from '@/types';
import { ArrowLeft, Clock, Users, Calendar, Power, Download, Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import AlertModal from '@/components/ui/AlertModal';

interface ExamDetail extends Exam {
    attempts_list?: Attempt[];
}

export default function ExamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [exam, setExam] = useState<ExamDetail | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [filter, setFilter] = useState('');
    
    // Alert State
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    useEffect(() => {
        if (params.id) fetchExamDetails();
    }, [params.id]);

    const fetchExamDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [resExam, resAttempts] = await Promise.all([
                axios.get(`http://localhost:8000/api/exams/${params.id}`, { headers }),
                axios.get(`http://localhost:8000/api/exams/${params.id}/attempts`, { headers })
            ]);

            setExam(resExam.data);
            setAttempts(resAttempts.data);
        } catch (error) {
            console.error("Failed to load details", error);
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to load exam details.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!exam) return;
        setToggling(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8000/api/exams/${exam.id}/status`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setExam(prev => prev ? ({ ...prev, is_active: !prev.is_active }) : null);
            setAlertState({ 
                isOpen: true, 
                title: 'Success', 
                message: `Exam ${!exam.is_active ? 'activated' : 'ended'} successfully.`, 
                type: 'success' 
            });
        } catch (error: any) {
             const msg = error.response?.data?.message || "Failed to update status.";
             setAlertState({ isOpen: true, title: 'Update Failed', message: msg, type: 'error' });
        } finally {
            setToggling(false);
        }
    };

    const filteredAttempts = attempts.filter(a => 
        a.student?.name?.toLowerCase().includes(filter.toLowerCase()) || 
        a.student?.email?.toLowerCase().includes(filter.toLowerCase()) ||
        a.student?.exam_number?.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="p-12 text-center text-slate-500">Loading details...</div>;
    if (!exam) return <div className="p-12 text-center text-red-500">Exam not found.</div>;

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
            <AlertModal 
                isOpen={alertState.isOpen} 
                onClose={() => setAlertState(prev => ({...prev, isOpen: false}))}
                {...alertState}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-800">{exam.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                exam.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                                {exam.is_active ? 'Active' : 'Ended'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm font-medium">
                            <span className="flex items-center gap-1"><Clock size={16}/> {exam.duration_minutes} Mins</span>
                            <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(exam.created_at || '').toLocaleDateString()}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded uppercase text-xs">{exam.type}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleToggleStatus}
                        disabled={toggling}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                            exam.is_active 
                                ? 'bg-slate-700 hover:bg-slate-800 shadow-slate-200' 
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                        }`}
                    >
                        {toggling ? <Loader2 size={20} className="animate-spin" /> : <Power size={20} />}
                        {exam.is_active ? 'End Exam' : 'Activate Exam'}
                    </button>
                </div>
            </div>

            {/* Attempts / Candidates Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Users className="text-slate-400" size={20}/>
                        <h2 className="text-lg font-bold text-slate-800">Candidates</h2>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{attempts.length}</span>
                    </div>
                    
                    <div className="relative w-full sm:w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input 
                            type="text" 
                            placeholder="Search student..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Student Name</th>
                                <th className="px-6 py-3">Exam ID</th>
                                <th className="px-6 py-3">Submitted At</th>
                                <th className="px-6 py-3">Score</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                             {filteredAttempts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        No candidates found for this exam.
                                    </td>
                                </tr>
                             ) : (
                                filteredAttempts.map((attempt) => (
                                    <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{attempt.student?.name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-400">{attempt.student?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            {attempt.student?.exam_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Ongoing'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {attempt.score !== undefined ? (
                                                <span className={`font-bold text-base ${(attempt.score || 0) >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {attempt.score}%
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {attempt.status === 'submitted' ? (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    (attempt.score || 0) >= 50 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {(attempt.score || 0) >= 50 ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                                                    {(attempt.score || 0) >= 50 ? 'Passed' : 'Failed'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                    On Going
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                             )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
