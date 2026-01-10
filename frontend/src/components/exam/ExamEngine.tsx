"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Question, Attempt } from '@/types';
import { useExamSecurity } from '@/hooks/useExamSecurity';
import axios from 'axios';
import { Loader2 } from 'lucide-react'; // Assuming lucide-react will be installed

interface ExamEngineProps {
    attempt: Attempt;
    initialQuestions: Question[];
}

export default function ExamEngine({ attempt, initialQuestions }: ExamEngineProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(attempt.exam ? attempt.exam.duration_minutes * 60 : 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useExamSecurity({ attemptId: attempt.id });

    // Timer
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
    }, []);

    // Auto-save every 30s
    useEffect(() => {
        const saveInterval = setInterval(() => {
            saveProgress();
        }, 30000);
        return () => clearInterval(saveInterval);
    }, [answers]);

    const saveProgress = async () => {
        console.log('Auto-saving...', answers);
        // Loop through answers and save changed ones (optimization needed in real app)
        // For now, submitting current question's answer
        const currentQ = initialQuestions[currentQuestionIndex];
        if (answers[currentQ.id]) {
             try {
                await axios.post(`http://localhost:8000/api/attempts/${attempt.id}/save`, {
                    question_id: currentQ.id,
                    student_answer: answers[currentQ.id],
                    time_spent_seconds: 0 // TODO: Track per question
                }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            } catch (err) {
                console.error('Save failed', err);
            }
        }
    };

    const handleAnswerSelect = (optionId: string | number) => {
        setAnswers(prev => ({ ...prev, [initialQuestions[currentQuestionIndex].id]: String(optionId) }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await saveProgress(); // Save last changes
            await axios.post(`http://localhost:8000/api/attempts/${attempt.id}/finish`, {}, {
                 headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Exam Submitted!');
            window.location.href = '/dashboard'; // Redirect
        } catch (error) {
            console.error('Submit failed', error);
            setIsSubmitting(false);
        }
    };

    const currentQuestion = initialQuestions[currentQuestionIndex];

    if (!currentQuestion) return <div>Loading questions...</div>;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
            <header className="flex justify-between items-center mb-6 p-4 bg-white shadow rounded-lg">
                <h1 className="text-xl font-bold">Question {currentQuestionIndex + 1} / {initialQuestions.length}</h1>
                <div className={`text-2xl font-mono ${timeLeft < 300 ? 'text-red-500' : 'text-gray-800'}`}>
                    {formatTime(timeLeft)}
                </div>
            </header>

            <main className="flex-1 bg-white p-6 shadow rounded-lg mb-6 overflow-y-auto">
                <h2 className="text-lg font-medium mb-4">{currentQuestion.text}</h2>
                <div className="space-y-3">
                    {currentQuestion.options_json?.map((opt) => (
                        <label key={opt.id} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                            <input
                                type="radio"
                                name="options"
                                value={opt.id}
                                checked={answers[currentQuestion.id] === String(opt.id) || false}
                                onChange={() => handleAnswerSelect(opt.id)}
                                className="h-5 w-5 text-blue-600"
                            />
                            <span>{opt.text}</span>
                        </label>
                    ))}
                </div>
            </main>

            <footer className="flex justify-between mt-4">
                <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                    Previous
                </button>
                {currentQuestionIndex < initialQuestions.length - 1 ? (
                    <button
                        onClick={() => {
                            saveProgress(); // Optimistic save on next
                            setCurrentQuestionIndex(prev => prev + 1);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                        {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Submit Exam
                    </button>
                )}
            </footer>
        </div>
    );
}
