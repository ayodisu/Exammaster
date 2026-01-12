"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Question, Attempt } from '@/types';
import { useExamSecurity } from '@/hooks/useExamSecurity';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { STORAGE_KEYS } from '@/config/constants';
import { Loader2, CheckCircle2, Clock, Monitor, ChevronLeft, ChevronRight, Hash, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertModal from '@/components/ui/AlertModal';

interface ExamEngineProps {
    attempt: Attempt;
    initialQuestions: Question[];
}

export default function ExamEngine({ attempt, initialQuestions }: ExamEngineProps) {
    const router = useRouter();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const answersRef = useRef(answers);
    const [timeLeft, setTimeLeft] = useState(attempt.exam ? attempt.exam.duration_minutes * 60 : 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<{ score: number; passed: boolean } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; onConfirm?: () => void; confirmText?: string; cancelText?: string; }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    useExamSecurity({ attemptId: attempt.id });

    // Sync answers ref for autosave
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    // Fullscreen Enforcement
    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {
                // Fail silently or show a non-intrusive waring if needed
                // console.warn("Fullscreen request denied or ignored.");
            });
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        // Only try on mount if user interaction is not required (unlikely)
        // Better to wait for first click
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Auto-submit on page close/navigate away
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Try to submit using sendBeacon for reliability
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            if (token && !submissionResult) {
                navigator.sendBeacon(
                    apiUrl(`attempts/${attempt.id}/finish`),
                    JSON.stringify({})
                );
            }
            // Show browser confirmation dialog
            e.preventDefault();
            e.returnValue = 'Your exam will be submitted if you leave. Are you sure?';
            return e.returnValue;
        };

        const handlePageHide = () => {
            // Fallback for mobile browsers
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            if (token && !submissionResult) {
                navigator.sendBeacon(
                    apiUrl(`attempts/${attempt.id}/finish`),
                    JSON.stringify({})
                );
            }
        };

        const handleVisibilityChange = () => {
            // If page becomes hidden (tab closed, switched away for too long), submit
            if (document.visibilityState === 'hidden' && !submissionResult) {
                const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
                if (token) {
                    navigator.sendBeacon(
                        apiUrl(`attempts/${attempt.id}/finish`),
                        JSON.stringify({})
                    );
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [attempt.id, submissionResult]);

    const saveProgress = useCallback(async () => {
        if (isSubmitting || submissionResult) return;
        
        const currentAns = answersRef.current;
        const currentQ = initialQuestions[currentQuestionIndex];
        if (currentAns[currentQ.id]) {
             try {
                await axios.post(apiUrl(`attempts/${attempt.id}/save`), {
                    question_id: currentQ.id,
                    student_answer: currentAns[currentQ.id],
                    time_spent_seconds: 0
                }, {
                    headers: getAuthHeaders()
                });
            } catch (err) {
                // Silently fail for background saves to avoid interrupting user
                console.error('Save failed', err);
            }
        }
    }, [attempt.id, currentQuestionIndex, initialQuestions, isSubmitting, submissionResult]);

    const confirmSubmit = () => {
        setAlertState({
            isOpen: true,
            title: 'Submit Exam?',
            message: 'Are you sure you want to finish? You cannot undo this action.',
            type: 'warning',
            confirmText: 'Yes, Submit',
            onConfirm: () => {
                setAlertState(prev => ({ ...prev, isOpen: false }));
                handleSubmit();
            }
        });
    };

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        try {
            await saveProgress();
            const res = await axios.post(apiUrl(`attempts/${attempt.id}/finish`), {}, {
                 headers: getAuthHeaders()
            });
            setSubmissionResult({ score: res.data.score || 0, passed: res.data.passed ?? true });
            setShowResultModal(true);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            
            // Auto-redirect to dashboard after 5 seconds
            setTimeout(() => {
                router.push('/student-dashboard');
            }, 5000);
        } catch (error) {
            console.error('Submit failed', error);
            setIsSubmitting(false);
            setAlertState({
                isOpen: true,
                title: 'Submission Failed',
                message: 'Something went wrong. Please check your internet and try again.',
                type: 'error'
            });
        }
    }, [attempt.id, saveProgress, router]);

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [handleSubmit]);

    const handleAnswerSelect = (optionId: string | number) => {
        setAnswers(prev => ({ ...prev, [initialQuestions[currentQuestionIndex].id]: String(optionId) }));
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const currentQuestion = initialQuestions[currentQuestionIndex];
    if (!currentQuestion) return <div className="h-[100dvh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

    // Timer Styles
    const isCriticalTime = timeLeft < 60;
    const isBlinking = timeLeft < 30;

    return (
        <div ref={containerRef} className="bg-slate-50 h-[100dvh] flex flex-col overflow-hidden select-none relative">
            
            <AlertModal 
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                {...alertState}
            />

            {/* Fullscreen Enforcer Overlay */}
            {!isFullscreen && !showResultModal && (
                <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4">
                    <div className="text-center text-white max-w-md animate-in slide-in-from-bottom-4">
                        <Monitor size={48} className="mx-auto mb-4 text-slate-400"/>
                        <h2 className="text-2xl font-bold mb-2">Fullscreen Required</h2>
                        <p className="text-slate-300 mb-6">Please enable fullscreen mode to improve your focus.</p>
                        <button onClick={enterFullscreen} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-transform active:scale-95 shadow-lg shadow-blue-900/50">
                            Enter Fullscreen
                        </button>
                        <button onClick={handleSubmit} className="block mx-auto mt-4 text-sm text-slate-500 hover:text-white">
                            Exit Exam (Submits Automatically)
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-10 w-full">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold font-mono">
                        {currentQuestionIndex + 1}
                    </div>
                    <div>
                        <h1 className="text-xs lg:text-sm font-bold text-slate-400 uppercase tracking-wider">Question</h1>
                        <span className="text-slate-800 font-bold block leading-none">Of {initialQuestions.length}</span>
                    </div>
                </div>

                <div className={`px-4 py-2 rounded-xl font-mono text-lg lg:text-xl font-bold flex items-center gap-2 transition-all duration-300 ${
                    isCriticalTime 
                        ? 'bg-red-100 text-red-600 border border-red-200' + (isBlinking ? ' animate-pulse' : '') 
                        : 'bg-slate-100 text-slate-700'
                }`}>
                    <Clock size={20} className={isCriticalTime ? 'animate-bounce' : ''} />
                    {formatTime(timeLeft)}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Column: Question + Footer */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Question Area */}
                    <main className="flex-1 overflow-y-auto p-4 lg:p-12 pb-24 lg:pb-12 scrollbar-thin scrollbar-thumb-slate-300">
                        <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 key={currentQuestionIndex}">
                            <div className="prose prose-lg max-w-none text-slate-800">
                                 <h2 className="text-xl md:text-3xl font-bold leading-relaxed">{currentQuestion.text}</h2>
                            </div>
                            
                            <div className="space-y-3 pb-8">
                                {currentQuestion.options_json?.map((opt) => {
                                    const isSelected = answers[currentQuestion.id] === String(opt.id);
                                    return (
                                        <label 
                                            key={opt.id} 
                                            className={`flex items-center gap-4 p-4 lg:p-5 rounded-2xl border-2 transition-all cursor-pointer group active:scale-[0.99] select-none ${
                                                isSelected 
                                                    ? 'border-blue-600 bg-blue-50/50 shadow-blue-100 shadow-lg' 
                                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                                            }`}>
                                                {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name={`q-${currentQuestion.id}`}
                                                value={opt.id}
                                                checked={isSelected}
                                                onChange={() => handleAnswerSelect(opt.id)}
                                                className="hidden"
                                            />
                                            <span className={`text-base lg:text-lg font-medium leading-normal ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>
                                                {opt.text}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </main>

                    {/* Desktop Navigation Footer */}
                    <div className="hidden lg:flex items-center justify-between p-6 bg-white border-t border-slate-200 z-30">
                         <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} /> Previous
                        </button>
                        
                        {currentQuestionIndex < initialQuestions.length - 1 ? (
                            <button
                                 onClick={() => {
                                    saveProgress();
                                    setCurrentQuestionIndex(prev => prev + 1);
                                }}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                Next <ChevronRight size={20} />
                            </button>
                        ) : (
                             <button
                                onClick={confirmSubmit}
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                            >
                                Submit Exam <Send size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Question Navigator (Sidebar) */}
                <aside className="w-80 bg-white border-l border-slate-200 hidden lg:flex flex-col z-20 shadow-lg">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Hash size={16} className="text-slate-400" /> Question Navigator
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                        <div className="grid grid-cols-5 gap-2">
                            {initialQuestions.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = idx === currentQuestionIndex;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            saveProgress();
                                            setCurrentQuestionIndex(idx);
                                        }}
                                        className={`aspect-square rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                                            isCurrent 
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-600 ring-offset-2' 
                                                : isAnswered 
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        <div className="mt-8 space-y-2 text-xs font-medium text-slate-500">
                             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600"></div> Current</div>
                             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Answered</div>
                             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div> Unanswered</div>
                        </div>
                    </div>
                    {/* Submit Area */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                            onClick={confirmSubmit}
                            disabled={isSubmitting}
                            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                            Submit Exam
                        </button>
                    </div>
                </aside>
            </div>

            {/* Bottom Bar (Mobile/Tablet Navigation) */}
            <footer className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-4 shrink-0 flex items-center justify-between lg:justify-end gap-4 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.1)] z-30 lg:hidden">
                <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={20} /> Back
                </button>
                
                {currentQuestionIndex < initialQuestions.length - 1 ? (
                    <button
                        onClick={() => {
                            saveProgress();
                             setCurrentQuestionIndex(prev => prev + 1);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        Next <ChevronRight size={20} />
                    </button>
                ) : (
                    // On mobile, show submit button here if it's the last question
                    <button
                        onClick={confirmSubmit}
                        className="flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                    >
                        Finish <Send size={18} />
                    </button>
                )}
            </footer>

            {/* Result Modal */}
            {showResultModal && submissionResult && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl bg-emerald-100 text-emerald-600">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            Submitted
                        </h2>
                        <p className="text-slate-500 mb-8">
                            Your exam has been successfully submitted.
                        </p>
                        
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Score</span>
                            <div className={`text-6xl font-black mt-2 ${submissionResult.passed ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {submissionResult.score}%
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/student-dashboard')}
                            className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-xl active:scale-95"
                        >
                            Return to Dashboard
                        </button>
                        <p className="text-xs text-slate-400 mt-4">Redirecting automatically in 5 seconds...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
