"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { Violation, Attempt, User, Exam } from '@/types';
import { AlertTriangle, Search, Clock, ShieldAlert, FileText, User as UserIcon, Loader2 } from 'lucide-react';

interface ExtendedViolation extends Violation {
    attempt: Attempt & {
        student: User;
        exam: Exam;
    };
}

export default function ViolationsPage() {
    const [violations, setViolations] = useState<ExtendedViolation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchViolations = async () => {
            try {
                const res = await axios.get(apiUrl('violations'), {
                    headers: getAuthHeaders()
                });
                setViolations(res.data);
            } catch (error) {
                console.error('Failed to fetch violations', error);
            } finally {
                setLoading(false);
            }
        };
        fetchViolations();
    }, []);

    const filtered = violations.filter(v =>
        v.attempt?.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.attempt?.exam?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <ShieldAlert size={32} />
                        </div>
                        Security Violations Report
                    </h1>
                    <p className="text-slate-500 mt-2 ml-14">Monitor and analyze candidate behavior and strictness violations.</p>
                </div>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by candidate, exam, or violation type..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className="text-sm text-slate-500 font-medium">
                        {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm">
                            <tr>
                                <th className="p-6 font-medium">Time Occurred</th>
                                <th className="p-6 font-medium">Candidate</th>
                                <th className="p-6 font-medium">Assessment</th>
                                <th className="p-6 font-medium">Violation Type</th>
                                <th className="p-6 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-indigo-500" size={24} />
                                            Loading violation reports...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShieldAlert className="text-slate-300" size={48} />
                                            No violations found matching your criteria.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(violation => (
                                    <tr key={violation.id} className="hover:bg-red-50/30 transition-colors group">
                                        <td className="p-6 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock size={16} />
                                                <span className="font-mono text-xs">
                                                    {new Date(violation.occurred_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                                                    {violation.attempt?.student?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{violation.attempt?.student?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{violation.attempt?.student?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <FileText size={16} className="text-slate-400" />
                                                <span className="font-medium">{violation.attempt?.exam?.title || 'Deleted Assessment'}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${violation.type === 'tab_switch' ? 'bg-amber-100 text-amber-700' :
                                                    violation.type === 'focus_lost' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                <AlertTriangle size={12} />
                                                {violation.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-slate-600 max-w-xs truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:max-w-none transition-all duration-300">
                                                {violation.details || 'No details provided'}
                                            </p>
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
