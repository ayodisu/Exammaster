"use client";

import Link from 'next/link';
import { Plus, Users, LayoutDashboard } from 'lucide-react'; // Stub import

export default function ExaminerDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Examiner Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/exams/create" className="p-6 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition">
                    <Plus className="w-8 h-8 text-blue-600 mb-2" />
                    <h2 className="text-xl font-semibold">Create New Exam</h2>
                    <p className="text-gray-600">Set up a new test with settings</p>
                </Link>

                <Link href="/live-monitor" className="p-6 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition">
                    <Users className="w-8 h-8 text-red-600 mb-2" />
                    <h2 className="text-xl font-semibold">Live Monitor</h2>
                    <p className="text-gray-600">Watch active students in real-time</p>
                </Link>

                <Link href="/question-bank" className="p-6 bg-green-50 border border-green-200 rounded-lg hover:shadow-md transition">
                    <LayoutDashboard className="w-8 h-8 text-green-600 mb-2" />
                    <h2 className="text-xl font-semibold">Question Bank</h2>
                    <p className="text-gray-600">Import and manage questions</p>
                </Link>
            </div>
        </div>
    );
}
