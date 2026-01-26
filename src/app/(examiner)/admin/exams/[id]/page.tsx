"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { Exam, Attempt, Question } from '@/types';
import { ArrowLeft, Clock, Users, Calendar, Power, Search, Loader2, CheckCircle, XCircle, Upload, FileDown, HelpCircle, Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import AlertModal from '@/components/ui/AlertModal';
import QuestionFormModal from '@/components/admin/QuestionFormModal';

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

    // Question Management State
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                const headers = getAuthHeaders();

                const [resExam, resAttempts] = await Promise.all([
                    axios.get(apiUrl(`assessments/${params.id}`), { headers }),
                    axios.get(apiUrl(`assessments/${params.id}/attempts`), { headers })
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

        if (params.id) fetchExamDetails();
    }, [params.id]);

    const handleToggleStatus = async () => {
        if (!exam) return;
        setToggling(true);
        try {
            await axios.put(apiUrl(`assessments/${exam.id}/status`), {}, {
                headers: getAuthHeaders()
            });

            setExam(prev => prev ? ({ ...prev, is_active: !prev.is_active }) : null);
            setAlertState({
                isOpen: true,
                title: 'Success',
                message: `Exam ${!exam.is_active ? 'activated' : 'ended'} successfully.`,
                type: 'success'
            });
        } catch (error: unknown) {
            let msg = "Failed to update status.";
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosErr = error as { response?: { data?: { message?: string } } };
                msg = axiosErr.response?.data?.message || msg;
            }
            setAlertState({ isOpen: true, title: 'Update Failed', message: msg, type: 'error' });
        } finally {
            setToggling(false);
        }
    };

    const handleSaveQuestion = async (data: Partial<Question>) => {
        if (!exam) return;
        try {
            let savedQuestion: Question;

            if (editingQuestion) {
                const res = await axios.put(apiUrl(`questions/${editingQuestion.id}`), data, { headers: getAuthHeaders() });
                savedQuestion = res.data;

                // Update local state
                setExam(prev => {
                    if (!prev) return null;
                    const updatedQuestions = prev.questions?.map(q => q.id === savedQuestion.id ? savedQuestion : q) || [];
                    return { ...prev, questions: updatedQuestions };
                });

                setAlertState({ isOpen: true, title: 'Success', message: 'Question updated.', type: 'success' });
            } else {
                const res = await axios.post(apiUrl(`assessments/${exam.id}/questions`), data, { headers: getAuthHeaders() });
                savedQuestion = res.data;

                // Add to local state
                setExam(prev => {
                    if (!prev) return null;
                    return { ...prev, questions: [...(prev.questions || []), savedQuestion] };
                });

                setAlertState({ isOpen: true, title: 'Success', message: 'Question added.', type: 'success' });
            }
            // NO RELOAD needed
        } catch (err) {
            console.error(err);
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to save question.', type: 'error' });
        }
    };

    const toggleSelectAll = () => {
        if (!exam?.questions) return;
        if (selectedIds.length === exam.questions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(exam.questions.map(q => q.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirm = window.confirm(`Are you sure you want to delete ${selectedIds.length} questions?`);
        if (!confirm) return;

        setBulkDeleting(true);
        try {
            await axios.post(apiUrl('questions/bulk-delete'), { ids: selectedIds }, { headers: getAuthHeaders() });

            // Optimistic update
            setExam(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    questions: prev.questions?.filter(q => !selectedIds.includes(q.id))
                };
            });
            setSelectedIds([]);
            setAlertState({ isOpen: true, title: 'Deleted', message: 'Questions deleted successfully.', type: 'success' });
        } catch (err) {
            console.error(err);
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to delete questions.', type: 'error' });
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const performDelete = async () => {
        if (!deleteConfirm.id) return;
        const id = deleteConfirm.id;
        setDeleting(true);

        try {
            await axios.delete(apiUrl(`questions/${id}`), { headers: getAuthHeaders() });

            // Optimistic update: Remove question from local state locally
            setExam(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    questions: prev.questions?.filter(q => q.id !== id)
                };
            });

            setDeleteConfirm({ isOpen: false, id: null });
            setAlertState({ isOpen: true, title: 'Deleted', message: 'Question deleted.', type: 'info' });
        } catch (err) {
            console.error(err);
            setDeleteConfirm({ isOpen: false, id: null });
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to delete question.', type: 'error' });
        } finally {
            setDeleting(false);
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
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
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
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${exam.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                {exam.is_active ? 'Active' : 'Ended'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm font-medium">
                            <span className="flex items-center gap-1"><Clock size={16} /> {exam.duration_minutes} Mins</span>
                            <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(exam.created_at || '').toLocaleDateString()}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded uppercase text-xs">{exam.type}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToggleStatus}
                        disabled={toggling}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${exam.is_active
                            ? 'bg-slate-700 hover:bg-slate-800 shadow-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                            }`}
                    >
                        {toggling ? <Loader2 size={20} className="animate-spin" /> : <Power size={20} />}
                        {exam.is_active ? 'End Exam' : 'Activate Exam'}
                    </button>
                </div>
            </div>

            {/* Questions Management */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Questions</h2>
                        <p className="text-slate-500 text-sm">{exam.questions?.length || 0} questions uploaded</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + "Question Text,Type,Option A,Option B,Option C,Option D,Correct Answer\n"
                                + "What is the capital of France?,mcq,Paris,London,Berlin,Madrid,Paris\n"
                                + "The earth is flat.,tf,True,False,,,False";
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "questions_template.csv");
                            document.body.appendChild(link);
                            link.click();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                    >
                        <FileDown size={18} />
                        Template
                    </button>

                    <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium cursor-pointer transition-colors transition-transform active:scale-95">
                        <Upload size={18} />
                        Import CSV
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const formData = new FormData();
                                formData.append('file', file);

                                try {
                                    setAlertState({ isOpen: true, title: 'Uploading...', message: 'Parsing and importing questions...', type: 'info' });
                                    await axios.post(apiUrl(`assessments/${exam.id}/questions/import`), formData, {
                                        headers: {
                                            ...getAuthHeaders(),
                                            'Content-Type': 'multipart/form-data'
                                        }
                                    });
                                    setAlertState({ isOpen: true, title: 'Success', message: 'Questions imported successfully!', type: 'success' });

                                    // Reload details
                                    const res = await axios.get(apiUrl(`assessments/${exam.id}`), { headers: getAuthHeaders() });
                                    setExam(prev => ({ ...prev, ...res.data }));
                                } catch (err) {
                                    console.error(err);
                                    setAlertState({ isOpen: true, title: 'Import Failed', message: 'Failed to import CSV. Check format.', type: 'error' });
                                }
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {/* Questions Header with Actions */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-800">Assessment Questions</h3>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={bulkDeleting}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-bold transition-colors animate-in fade-in zoom-in"
                            >
                                {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Delete ({selectedIds.length})
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Select All Checkbox */}
                        {exam.questions && exam.questions.length > 0 && (
                            <label className="flex items-center gap-2 text-sm text-slate-500 font-medium cursor-pointer hover:text-slate-700">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={exam.questions.length > 0 && selectedIds.length === exam.questions.length}
                                    onChange={toggleSelectAll}
                                />
                                Select All
                            </label>
                        )}
                        <button
                            onClick={() => { setEditingQuestion(null); setIsQuestionModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold active:scale-95 transition-all"
                        >
                            <Plus size={18} />
                            Add Manually
                        </button>
                    </div>
                </div>

                {
                    (!exam.questions || exam.questions.length === 0) ? (
                        // ... (empty state)
                        <div className="p-8 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                            No questions added yet. Use the import tool above or add manually.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {exam.questions.map((q, idx) => (
                                <div key={q.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all ${selectedIds.includes(q.id) ? 'border-indigo-400 ring-1 ring-indigo-400 bg-indigo-50/10' : 'border-slate-200'}`}>
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                        onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    checked={selectedIds.includes(q.id)}
                                                    onChange={() => toggleSelectOne(q.id)}
                                                />
                                            </div>
                                            <div className="w-8 h-8 flex-shrink-0 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800 line-clamp-1">{q.text}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-mono uppercase ${q.type === 'mcq' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {q.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 pl-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingQuestion(q); setIsQuestionModalOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(q.id); }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {expandedQuestionId === q.id ? <ChevronDown size={20} className="text-slate-300" /> : <ChevronRight size={20} className="text-slate-300" />}
                                        </div>
                                    </div>

                                    {expandedQuestionId === q.id && (
                                        <div className="px-4 pb-4 pt-0 text-sm border-t border-slate-100 bg-slate-50/50">
                                            <div className="mt-4 grid gap-2">
                                                {q.options_json?.map((opt: { id: string | number; text: string }, i: number) => (
                                                    <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border ${(q.type === 'mcq' && opt.text === q.correct_answer) || (String(opt.id) === String(q.correct_answer)) // Match text or ID
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                                                        : 'bg-white border-slate-200 text-slate-600'
                                                        }`}>
                                                        <div className="w-6 h-6 flex items-center justify-center rounded bg-black/5 text-xs font-bold">
                                                            {q.type === 'mcq' ? String.fromCharCode(65 + i) : (i === 0 ? 'T' : 'F')}
                                                        </div>
                                                        <span>{opt.text}</span>
                                                        {((q.type === 'mcq' && opt.text === q.correct_answer) || (String(opt.id) === String(q.correct_answer))) && (
                                                            <CheckCircle size={14} className="ml-auto text-emerald-600" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                }
            </div >

            <QuestionFormModal
                isOpen={isQuestionModalOpen}
                onClose={() => setIsQuestionModalOpen(false)}
                onSave={handleSaveQuestion}
                initialData={editingQuestion}
            />

            <AlertModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={performDelete}
                title="Delete Question?"
                message="Are you sure you want to delete this question? This action cannot be undone."
                type="warning"
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleting}
            />

            {/* Attempts / Candidates Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Users className="text-slate-400" size={20} />
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
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${(attempt.score || 0) >= 50
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {(attempt.score || 0) >= 50 ? <CheckCircle size={12} /> : <XCircle size={12} />}
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
        </div >
    );
}
