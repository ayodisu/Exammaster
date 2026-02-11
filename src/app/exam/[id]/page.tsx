"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ExamEngine from '@/components/exam/ExamEngine';
import { Attempt, Question } from '@/types';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import AlertModal from '@/components/ui/AlertModal';

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'error'
    });

    useEffect(() => {
        if (!id) return;

        const startExam = async () => {
            try {
                // Start or resume attempt
                const res = await axios.post(apiUrl(`assessments/${id}/start`), {}, {
                    headers: getAuthHeaders()
                });
                setAttempt(res.data);
                if (res.data.exam && res.data.exam.questions) {
                    setQuestions(res.data.exam.questions);
                }
            } catch (err: any) {
                console.error(err);
                let message = 'Failed to load exam. Please try again.';
                let title = 'Error';

                if (err.response?.status === 403) {
                    title = 'Assessment Ended';
                    message = err.response?.data?.message || 'This assessment has ended or is no longer active.';
                }

                setAlertState({
                    isOpen: true,
                    title,
                    message,
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        startExam();
    }, [id]);

    const handleAlertClose = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
        router.push('/student-dashboard');
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading Exam...</div>;

    return (
        <>
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={handleAlertClose}
                onConfirm={handleAlertClose}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                confirmText="Back to Dashboard"
                cancelText="Close"
            />

            {/* Show completed state if applicable, otherwise hidden if error exists */}
            {attempt && (attempt.status === 'submitted' || attempt.status === 'terminated') ? (
                <div className="flex flex-col h-screen items-center justify-center space-y-4">
                    <div className="text-2xl font-bold text-slate-800">Assessment Completed</div>
                    <p className="text-slate-600">You have already submitted this assessment.</p>
                    <a href="/results" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        View Results
                    </a>
                </div>
            ) : (
                attempt ? <ExamEngine attempt={attempt} initialQuestions={questions} /> : null
            )}
        </>
    );
}
