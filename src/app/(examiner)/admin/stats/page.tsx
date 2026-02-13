"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { Loader2, BarChart2, TrendingUp, Users, Clock, Award } from 'lucide-react';

interface StatsData {
    total_students: number;
    total_exams: number;
    total_attempts: number;
    avg_duration: string;
    overall_pass_rate: number;
    avg_score: number;
    score_distribution: Record<string, number>;
    per_exam: {
        id: number;
        title: string;
        type: string;
        attempts: number;
        avg_score: number;
        pass_rate: number;
    }[];
}

export default function ExaminerStatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(apiUrl('assessments/stats/overview'), {
                    headers: getAuthHeaders()
                });
                setStats(res.data);
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

    if (!stats) return null;

    const maxDistribution = Math.max(...Object.values(stats.score_distribution), 1);

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
                <p className="text-slate-500 mt-2">Detailed performance metrics and score analysis.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <BarChart2 size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Exams</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.total_exams}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Students</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.total_students}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Overall Pass Rate</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.overall_pass_rate}%</h3>
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

            {/* Score Distribution + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Award size={20} className="text-indigo-600" /> Score Distribution
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.score_distribution).map(([range, count]) => (
                            <div key={range} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-500 w-16 shrink-0">{range}%</span>
                                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg transition-all duration-700"
                                        style={{ width: `${(count / maxDistribution) * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-slate-700 w-8 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
                        <span className="text-slate-400">Total Attempts: <strong className="text-slate-600">{stats.total_attempts}</strong></span>
                        <span className="text-slate-400">Avg Score: <strong className="text-indigo-600">{stats.avg_score}%</strong></span>
                    </div>
                </div>

                {/* Quick Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-emerald-600" /> Quick Summary
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-medium">Average Score</span>
                            <span className={`text-2xl font-bold ${stats.avg_score >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>{stats.avg_score}%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-medium">Pass Rate</span>
                            <span className={`text-2xl font-bold ${stats.overall_pass_rate >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>{stats.overall_pass_rate}%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-medium">Avg Duration</span>
                            <span className="text-2xl font-bold text-slate-800">{stats.avg_duration}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-medium">Total Submissions</span>
                            <span className="text-2xl font-bold text-slate-800">{stats.total_attempts}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-Exam Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Per-Exam Breakdown</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Exam Title</th>
                            <th className="px-6 py-4 font-semibold">Type</th>
                            <th className="px-6 py-4 font-semibold">Attempts</th>
                            <th className="px-6 py-4 font-semibold">Avg Score</th>
                            <th className="px-6 py-4 font-semibold">Pass Rate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stats.per_exam.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-400">No exam data available.</td></tr>
                        ) : stats.per_exam.map((exam) => (
                            <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{exam.title}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${exam.type === 'mock' ? 'bg-amber-100 text-amber-700' :
                                            exam.type === 'test' ? 'bg-purple-100 text-purple-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>{exam.type}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{exam.attempts}</td>
                                <td className="px-6 py-4 font-bold text-indigo-600">{exam.avg_score}%</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${exam.pass_rate >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {exam.pass_rate}%
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
