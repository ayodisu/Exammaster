"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { Attempt } from '@/types';
import { Loader2, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function ResultsPage() {
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAttempts = async () => {
            try {
                const res = await axios.get(apiUrl('attempts'), { // Use verified endpoint
                    headers: getAuthHeaders()
                });
                setAttempts(res.data);
            } catch (err) {
                setError('Failed to load results.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAttempts();
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                 <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                 <p className="text-slate-600">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">My Results</h1>
                <p className="text-slate-500">History of your exam attempts.</p>
            </div>

            {attempts.length === 0 ? (
                 <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">No exams taken yet</h3>
                    <p className="text-slate-500 mt-1">When you complete an exam, results will appear here.</p>
                 </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Exam Title</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Score</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {attempts.map((attempt) => (
                                    <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800 text-base">
                                            {attempt.exam?.title || 'Unknown Exam'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {attempt.submitted_at 
                                                ? new Date(attempt.submitted_at).toLocaleDateString() 
                                                : 'In Progress'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {attempt.score !== undefined ? (
                                                <span className="font-bold text-slate-800">{attempt.score}%</span>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
