"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Exam } from '@/types';
import Link from 'next/link';

export default function ExamsList() {
    const [exams, setExams] = useState<Exam[]>([]);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/exams', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setExams(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchExams();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Available Exams</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exams.map((exam) => (
                    <div key={exam.id} className="p-6 bg-white rounded-lg shadow border hover:shadow-md">
                        <h2 className="text-xl font-bold mb-2">{exam.title}</h2>
                        <p className="text-gray-600 mb-4">{exam.duration_minutes} Minutes</p>
                        <Link href={`/exam/${exam.id}`} className="block w-full text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Start Exam
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
