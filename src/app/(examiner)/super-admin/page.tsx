"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { STORAGE_KEYS } from '@/config/constants';
import { Loader2, Users, Shield, Trash2, Ban, CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminUser {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    status: string;
    is_admin?: boolean;
    exam_number?: string;
    created_at: string;
    attempts_count?: number;
    exams_count?: number;
}

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState<'candidate' | 'examiner'>('candidate');
    const [candidates, setCandidates] = useState<AdminUser[]>([]);
    const [examiners, setExaminers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check if user is admin
        const stored = localStorage.getItem(STORAGE_KEYS.USER);
        if (stored) {
            const user = JSON.parse(stored);
            if (!user.is_admin) {
                router.push('/dashboard');
                return;
            }
        }
        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(apiUrl('admin/users'), { headers: getAuthHeaders() });
            setCandidates(res.data.candidates || []);
            setExaminers(res.data.examiners || []);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load users.' });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (type: string, id: number, status: string) => {
        setActionLoading(`${type}-${id}-status`);
        setMessage(null);
        try {
            const res = await axios.put(apiUrl(`admin/users/${type}/${id}/status`), { status }, { headers: getAuthHeaders() });
            setMessage({ type: 'success', text: res.data.message });
            fetchUsers();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setMessage({ type: 'error', text: err.response.data.message || 'Action failed.' });
            }
        } finally {
            setActionLoading(null);
        }
    };

    const deleteUser = async (type: string, id: number) => {
        setActionLoading(`${type}-${id}-delete`);
        setMessage(null);
        try {
            const res = await axios.delete(apiUrl(`admin/users/${type}/${id}`), { headers: getAuthHeaders() });
            setMessage({ type: 'success', text: res.data.message });
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setMessage({ type: 'error', text: err.response.data.message || 'Delete failed.' });
            }
        } finally {
            setActionLoading(null);
        }
    };

    const filteredCandidates = candidates.filter(c =>
        `${c.first_name} ${c.last_name} ${c.email} ${c.exam_number || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const filteredExaminers = examiners.filter(e =>
        `${e.name} ${e.email}`.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Shield className="text-indigo-600" size={28} /> Super Admin Dashboard
                </h1>
                <p className="text-slate-500 mt-1">Manage all users across the platform.</p>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-xl border text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-sm text-slate-500">Total Candidates</div>
                    <div className="text-2xl font-bold text-slate-800 mt-1">{candidates.length}</div>
                    <div className="text-xs text-amber-600 mt-1">
                        {candidates.filter(c => c.status === 'suspended').length} suspended
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-sm text-slate-500">Total Examiners</div>
                    <div className="text-2xl font-bold text-slate-800 mt-1">{examiners.length}</div>
                    <div className="text-xs text-amber-600 mt-1">
                        {examiners.filter(e => e.status === 'suspended').length} suspended
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-sm text-slate-500">Total Admins</div>
                    <div className="text-2xl font-bold text-slate-800 mt-1">{examiners.filter(e => e.is_admin).length}</div>
                </div>
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex bg-slate-100 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('candidate')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'candidate' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users size={16} className="inline mr-2" />Candidates ({candidates.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('examiner')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'examiner' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Shield size={16} className="inline mr-2" />Examiners ({examiners.length})
                    </button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="text-left py-3 px-4 font-medium">Name</th>
                                <th className="text-left py-3 px-4 font-medium">Email</th>
                                <th className="text-left py-3 px-4 font-medium">Status</th>
                                <th className="text-left py-3 px-4 font-medium">
                                    {activeTab === 'candidate' ? 'Attempts' : 'Exams'}
                                </th>
                                <th className="text-left py-3 px-4 font-medium">Joined</th>
                                <th className="text-right py-3 px-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeTab === 'candidate' ? (
                                filteredCandidates.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">No candidates found.</td></tr>
                                ) : filteredCandidates.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-800">
                                            {user.first_name} {user.last_name}
                                            {user.exam_number && (
                                                <span className="text-xs text-slate-400 font-mono ml-2">{user.exam_number}</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">{user.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">{user.attempts_count ?? 0}</td>
                                        <td className="py-3 px-4 text-slate-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => updateStatus('candidate', user.id, 'suspended')}
                                                        disabled={actionLoading === `candidate-${user.id}-status`}
                                                        className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                        title="Suspend"
                                                    >
                                                        {actionLoading === `candidate-${user.id}-status` ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => updateStatus('candidate', user.id, 'active')}
                                                        disabled={actionLoading === `candidate-${user.id}-status`}
                                                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                        title="Activate"
                                                    >
                                                        {actionLoading === `candidate-${user.id}-status` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'candidate', id: user.id, name: `${user.first_name} ${user.last_name}` })}
                                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredExaminers.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">No examiners found.</td></tr>
                                ) : filteredExaminers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-800">
                                            {user.name}
                                            {user.is_admin && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">Admin</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">{user.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">{user.exams_count ?? 0}</td>
                                        <td className="py-3 px-4 text-slate-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => updateStatus('examiner', user.id, 'suspended')}
                                                        disabled={actionLoading === `examiner-${user.id}-status`}
                                                        className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                        title="Suspend"
                                                    >
                                                        {actionLoading === `examiner-${user.id}-status` ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => updateStatus('examiner', user.id, 'active')}
                                                        disabled={actionLoading === `examiner-${user.id}-status`}
                                                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                        title="Activate"
                                                    >
                                                        {actionLoading === `examiner-${user.id}-status` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'examiner', id: user.id, name: user.name || '' })}
                                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Delete User</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">
                            Are you sure you want to permanently delete <strong>{deleteConfirm.name}</strong>? All their data will be removed.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteUser(deleteConfirm.type, deleteConfirm.id)}
                                disabled={actionLoading === `${deleteConfirm.type}-${deleteConfirm.id}-delete`}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                            >
                                {actionLoading === `${deleteConfirm.type}-${deleteConfirm.id}-delete` ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Trash2 size={14} />
                                )}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
