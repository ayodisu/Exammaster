"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import {
    Loader2, ArrowLeft, CheckCircle, XCircle, Clock, HelpCircle,
    BarChart3, Target, Timer, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface QuestionBreakdown {
    question_id: number;
    question_text: string;
    question_type: string;
    options: { id: string; text: string }[] | string[] | null;
    correct_answer: string;
    student_answer: string | null;
    is_correct: boolean;
    time_spent_seconds: number;
    explanation: string | null;
}



interface TypeStat {
    type: string;
    total: number;
    correct: number;
    accuracy: number;
}

interface AttemptDetail {
    attempt: {
        id: number;
        score: number;
        status: string;
        started_at: string;
        submitted_at: string;
    };
    exam: {
        id: number;
        title: string;
        type: string;
        duration_minutes: number;
    };
    summary: {
        total_questions: number;
        answered: number;
        correct: number;
        incorrect: number;
        unanswered: number;
        total_time_spent_seconds: number;
        avg_time_per_question_seconds: number;
        type_stats: TypeStat[];
    };
    breakdown: QuestionBreakdown[];
}

export default function ResultDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [data, setData] = useState<AttemptDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchDetail = async () => {
            try {
                const res = await axios.get(apiUrl(`attempts/${id}/detail`), {
                    headers: getAuthHeaders()
                });

                setData(res.data);
            } catch (err) {
                console.error('API Error:', err);
                setError('Failed to load result details.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                <p className="text-slate-600">{error || 'No data found.'}</p>
                <Link href="/results" className="mt-4 text-indigo-600 font-semibold hover:underline">
                    Back to Results
                </Link>
            </div>
        );
    }

    const { attempt, exam, summary, breakdown } = data;
    const passed = attempt.score >= 50;
    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/results" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium mb-4">
                    <ArrowLeft size={16} /> Back to Results
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">{exam.title}</h1>
                <p className="text-slate-500 text-sm mt-1">
                    {exam.type.toUpperCase()} • {exam.duration_minutes} minutes • Submitted {new Date(attempt.submitted_at).toLocaleDateString()}
                </p>
            </div>

            {/* Score Banner */}
            <div className={`rounded-2xl p-6 mb-6 ${passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {attempt.score}%
                        </div>
                        <div>
                            <div className={`text-lg font-bold ${passed ? 'text-emerald-800' : 'text-red-800'}`}>
                                {passed ? '🎉 Passed' : '❌ Failed'}
                            </div>
                            <p className={`text-sm ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                                {summary.correct} of {summary.total_questions} correct
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <Target className="mx-auto text-emerald-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800">{summary.correct}</div>
                    <div className="text-xs text-slate-500 font-medium">Correct</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <XCircle className="mx-auto text-red-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800">{summary.incorrect}</div>
                    <div className="text-xs text-slate-500 font-medium">Incorrect</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <HelpCircle className="mx-auto text-amber-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800">{summary.unanswered}</div>
                    <div className="text-xs text-slate-500 font-medium">Unanswered</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <Timer className="mx-auto text-indigo-500 mb-2" size={24} />
                    <div className="text-2xl font-bold text-slate-800">{formatTime(summary.avg_time_per_question_seconds)}</div>
                    <div className="text-xs text-slate-500 font-medium">Avg per Q</div>
                </div>
            </div>

            {/* Type Accuracy */}
            {summary.type_stats.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <BarChart3 size={18} className="text-indigo-500" /> Accuracy by Question Type
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {summary.type_stats.map((stat) => (
                            <div key={stat.type} className="flex-1 min-w-[150px] bg-slate-50 rounded-xl p-4">
                                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">{stat.type}</div>
                                <div className="text-xl font-bold text-slate-800">{stat.accuracy}%</div>
                                <div className="text-xs text-slate-400">{stat.correct}/{stat.total} correct</div>
                                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${stat.accuracy >= 50 ? 'bg-emerald-500' : 'bg-red-400'}`}
                                        style={{ width: `${stat.accuracy}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Per-Question Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Question-by-Question Review</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {breakdown.map((q, index) => (
                        <div key={q.question_id} className={`p-6 ${q.is_correct ? '' : 'bg-red-50/30'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${q.is_correct ? 'bg-emerald-100' : q.student_answer ? 'bg-red-100' : 'bg-slate-100'}`}>
                                    {q.is_correct ? (
                                        <CheckCircle size={16} className="text-emerald-600" />
                                    ) : q.student_answer ? (
                                        <XCircle size={16} className="text-red-600" />
                                    ) : (
                                        <HelpCircle size={16} className="text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-400">Q{index + 1}</span>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium uppercase">{q.question_type}</span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                                            <Clock size={12} /> {formatTime(q.time_spent_seconds)}
                                        </span>
                                    </div>
                                    <p className="text-slate-800 font-medium text-sm mb-3">{q.question_text}</p>

                                    {/* Options display for MCQ/TF */}
                                    {q.options && (
                                        <div className="space-y-1.5 mb-3">
                                            {q.options.map((option: { id: string; text: string } | string, optIndex: number) => {
                                                const optionLetter = String.fromCharCode(65 + optIndex);
                                                const optionText = typeof option === 'string' ? option : option.text;
                                                const optionId = typeof option === 'string' ? option : option.id;

                                                const isCorrectOption = q.correct_answer === optionLetter || q.correct_answer === optionId || q.correct_answer === optionText;
                                                const isStudentPick = q.student_answer === optionLetter || q.student_answer === optionId || q.student_answer === optionText;

                                                return (
                                                    <div
                                                        key={optIndex}
                                                        className={`text-sm px-3 py-2 rounded-lg border flex items-center gap-2
                                                            ${isCorrectOption ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : ''}
                                                            ${isStudentPick && !isCorrectOption ? 'border-red-300 bg-red-50 text-red-800' : ''}
                                                            ${!isCorrectOption && !isStudentPick ? 'border-slate-200 text-slate-600' : ''}
                                                        `}
                                                    >
                                                        <span className="font-bold text-xs w-5">{optionLetter}.</span>
                                                        <span className="flex-1">{optionText}</span>
                                                        {isCorrectOption && <CheckCircle size={14} className="text-emerald-600 shrink-0" />}
                                                        {isStudentPick && !isCorrectOption && <XCircle size={14} className="text-red-600 shrink-0" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* For non-option questions, show answers directly */}
                                    {!q.options && (
                                        <div className="text-sm space-y-1 mb-3">
                                            <div><span className="font-medium text-slate-500">Your Answer:</span> <span className={q.is_correct ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>{q.student_answer || 'Not answered'}</span></div>
                                            {!q.is_correct && <div><span className="font-medium text-slate-500">Correct Answer:</span> <span className="text-emerald-700 font-semibold">{q.correct_answer}</span></div>}
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {q.explanation && (
                                        <div className="text-xs bg-indigo-50 text-indigo-700 p-3 rounded-lg border border-indigo-100">
                                            <span className="font-bold">Explanation:</span> {q.explanation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
