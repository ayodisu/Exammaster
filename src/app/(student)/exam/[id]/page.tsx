"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ExamEngine from '@/components/exam/ExamEngine';
import { Attempt, Question } from '@/types';
import axios from 'axios';

export default function ExamPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        const startExam = async () => {
            try {
                // Start or resume attempt
                const res = await axios.post(`http://localhost:8000/api/exams/${id}/start`, {}, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setAttempt(res.data);
                // In real app, questions might come from separate endpoint or nested
                if (res.data.exam && res.data.exam.questions) {
                    setQuestions(res.data.exam.questions);
                }
            } catch (err) {
                setError('Failed to load exam. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        startExam();
    }, [id]);

    if (loading) return <div className="flex h-screen items-center justify-center">Loading Exam...</div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-600">{error}</div>;
    if (!attempt) return null;

    return <ExamEngine attempt={attempt} initialQuestions={questions} />;
}
