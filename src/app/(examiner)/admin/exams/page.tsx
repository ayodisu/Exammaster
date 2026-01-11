"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Exam } from '@/types';
import { Plus, Search, Filter, ChevronRight, BookOpen, Clock, Users, Power, Loader2 } from 'lucide-react';
import CurrentTime from '@/components/CurrentTime';
import AlertModal from '@/components/ui/AlertModal';

export default function AdminExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8000/api/exams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setExams(res.data);
        } catch (error) {
            console.error('Failed to fetch exams', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: number) => {
        setTogglingId(id);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8000/api/exams/${id}/status`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setExams(prev => prev.map(e => e.id === id ? { ...e, is_active: !e.is_active } : e));
            setAlertState({ isOpen: true, title: 'Success', message: 'Exam status updated.', type: 'success' });
        } catch (error: any) {
            const msg = error.response?.data?.message || "Failed to update status.";
            setAlertState({ isOpen: true, title: 'Error', message: msg, type: 'error' });
        } finally {
            setTogglingId(null);
        }
    };

    const filteredExams = exams.filter(exam => 
        exam.title.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
            <AlertModal 
                isOpen={alertState.isOpen} 
                onClose={() => setAlertState(prev => ({...prev, isOpen: false}))}
                {...alertState}
            />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">My Exams</h1>
                    <p className="text-slate-500 mt-1">Manage and monitor your assessments.</p>
                </div>
                <div className="flex items-center gap-4">
                    <CurrentTime />
                    <Link 
                        href="/admin/exams/create"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Plus size={20} /> Create Exam
                    </Link>
                </div>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search exams..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Filter size={16} />
                        <span>{filteredExams.length} Exams</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Detailed Info</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Candidates</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">Loading exams...</td>
                                </tr>
                            ) : filteredExams.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                            <BookOpen size={24} />
                                        </div>
                                        <p className="text-slate-500">No exams found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredExams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-slate-800 text-base">{exam.title}</div>
                                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                                    <span className="flex items-center gap-1"><Clock size={12}/> {exam.duration_minutes} mins</span>
                                                    <span>•</span>
                                                    <span>Created {new Date(exam.created_at || '').toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                                exam.type === 'mock' ? 'bg-amber-100 text-amber-700' :
                                                exam.type === 'test' ? 'bg-purple-100 text-purple-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {exam.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Users size={16} className="text-slate-400" />
                                                <span className="font-medium">{exam.stats?.attempts || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                exam.is_active 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                <span className={`w-2 h-2 rounded-full ${exam.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                {exam.is_active ? 'Active' : 'Ended'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleToggleStatus(exam.id)}
                                                    disabled={togglingId === exam.id}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        exam.is_active 
                                                            ? 'text-emerald-600 hover:bg-emerald-50' 
                                                            : 'text-slate-400 hover:bg-slate-100'
                                                    }`}
                                                    title={exam.is_active ? "End Exam" : "Activate Exam"}
                                                >
                                                    {togglingId === exam.id ? <Loader2 size={18} className="animate-spin"/> : <Power size={18} />}
                                                </button>
                                                <Link 
                                                    href={`/admin/exams/${exam.id}`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                >
                                                    <ChevronRight size={20} />
                                                </Link>
                                            </div>
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
