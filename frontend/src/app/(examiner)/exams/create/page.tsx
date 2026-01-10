"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loader2, BookOpen, BrainCircuit, Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
// import { generateExam } from '@/services/geminiService'; // TODO: Move to API route

export default function CreateExamPage() {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [questionCount, setQuestionCount] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        if (!topic) return;
        setIsLoading(true);
        try {
            // Mock Generation for now, or call API
            // const examData = await generateExam(topic, difficulty, questionCount);
            
            // Temporary Mock to verify UI
            await new Promise(r => setTimeout(r, 2000));
            const newExam = {
                title: `${topic} Exam`,
                duration_minutes: questionCount * 2,
                questions: Array(questionCount).fill(null).map((_, i) => ({
                    text: `Sample Question ${i+1} about ${topic}`,
                    type: 'mcq',
                    options: ['A', 'B', 'C', 'D'],
                    correct_answer: 'A'
                }))
            };

            // Save to Backend
            await axios.post('http://localhost:8000/api/exams', newExam, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            alert("Failed to generate exam. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 animate-in fade-in">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                <h3 className="text-2xl font-bold text-slate-800">Generating Exam...</h3>
                <p className="text-slate-500 mt-2">Consulting the knowledge base about &quot;{topic}&quot;</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-8">
                    <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium mb-6">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit className="text-indigo-600"/> Create New Exam
                    </h2>
                    <p className="text-slate-500 mt-1">Enter a topic and let AI generate a test for you.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Topic or Subject</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="e.g. History of Rome, Javascript Basics"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                            <div className="relative">
                                <Layers className="absolute left-3 top-3.5 text-slate-400" size={20} />
                                <select
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Number of Questions</label>
                            <input 
                                type="number" 
                                min={3} 
                                max={20}
                                value={questionCount}
                                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-8 pt-4 border-t border-slate-100">
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleCreate}
                            disabled={!topic}
                            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                        >
                            Generate Exam
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
