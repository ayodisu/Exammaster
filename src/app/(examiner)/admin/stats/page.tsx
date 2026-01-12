"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { Loader2 } from 'lucide-react';
import { Exam } from '@/types';

export default function ExaminerStatsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(apiUrl('exams'), {
                    headers: getAuthHeaders()
                });
                setExams(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
             <div>
                <h1 className="text-3xl font-bold text-slate-900">Student Performance Stats</h1>
                <p className="text-slate-500 mt-2">Overview of pass rates and average scores.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Exam Title</th>
                            <th className="px-6 py-4 font-semibold">Attempts</th>
                            <th className="px-6 py-4 font-semibold">Avg. Score</th>
                            <th className="px-6 py-4 font-semibold">Pass Rate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {exams.map((exam) => (
                            <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800 text-base">
                                    {exam.title}
                                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs uppercase font-bold">
                                        {exam.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{exam.stats?.attempts || 0}</td>
                                <td className="px-6 py-4 font-bold text-indigo-600">{exam.stats?.avg_score || 0}%</td>
                                <td className="px-6 py-4">
                                     <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        Number(exam.stats?.pass_rate || 0) >= 50 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {exam.stats?.pass_rate || 0}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
