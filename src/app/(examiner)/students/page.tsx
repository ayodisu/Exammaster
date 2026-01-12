"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { User, Attempt } from '@/types';
import { Search, User as UserIcon, Mail, X, BookOpen, TrendingUp, Award, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface StudentWithStats extends User {
    attempts_count?: number;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<StudentWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
    const [studentAttempts, setStudentAttempts] = useState<Attempt[]>([]);
    const [loadingAttempts, setLoadingAttempts] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await axios.get(apiUrl('students'), {
                    headers: getAuthHeaders()
                });
                setStudents(res.data);
            } catch (error) {
                console.error('Failed to fetch students', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const handleStudentClick = async (student: StudentWithStats) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
        setLoadingAttempts(true);
        setStudentAttempts([]);

        try {
            const res = await axios.get(apiUrl(`students/${student.id}/attempts`), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setStudentAttempts(res.data);
        } catch (error) {
            console.error('Failed to fetch student attempts', error);
        } finally {
            setLoadingAttempts(false);
        }
    };

    const filteredStudents = students.filter(s => 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.exam_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats for modal
    const submittedAttempts = studentAttempts.filter(a => a.status === 'submitted');
    const avgScore = submittedAttempts.length > 0 
        ? Math.round(submittedAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / submittedAttempts.length)
        : 0;
    const passCount = submittedAttempts.filter(a => (a.score || 0) >= 50).length;
    const passRate = submittedAttempts.length > 0 ? Math.round((passCount / submittedAttempts.length) * 100) : 0;

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Registered Candidates</h1>
                    <p className="text-slate-500 mt-2">Click on a student to view their exam history.</p>
                </div>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name, email, or exam number..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className="text-sm text-slate-500 font-medium">
                        {filteredStudents.length} candidate{filteredStudents.length !== 1 ? 's' : ''}
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm">
                            <tr>
                                <th className="p-6 font-medium">Candidate</th>
                                <th className="p-6 font-medium">Contact</th>
                                <th className="p-6 font-medium">Exam ID</th>
                                <th className="p-6 font-medium">Exams Taken</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading candidates...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No candidates found.</td></tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr 
                                        key={student.id} 
                                        onClick={() => handleStudentClick(student)}
                                        className="hover:bg-indigo-50/50 transition-colors cursor-pointer"
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                    {student.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="font-bold text-slate-800">{student.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} /> {student.email}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                                {student.exam_number || '-'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                (student.attempts_count || 0) > 0 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                <BookOpen size={12} /> {student.attempts_count || 0}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Student Detail Modal */}
            {isModalOpen && selectedStudent && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                                    {selectedStudent.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-slate-800">{selectedStudent.name}</h2>
                                    <p className="text-sm text-slate-500">{selectedStudent.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-100 shrink-0">
                            <div className="bg-indigo-50 rounded-xl p-4 text-center">
                                <BookOpen className="mx-auto text-indigo-500 mb-1" size={24} />
                                <div className="text-2xl font-bold text-indigo-700">{submittedAttempts.length}</div>
                                <div className="text-xs text-indigo-600 font-medium">Exams Taken</div>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-4 text-center">
                                <TrendingUp className="mx-auto text-amber-500 mb-1" size={24} />
                                <div className="text-2xl font-bold text-amber-700">{avgScore}%</div>
                                <div className="text-xs text-amber-600 font-medium">Avg Score</div>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                <Award className="mx-auto text-emerald-500 mb-1" size={24} />
                                <div className="text-2xl font-bold text-emerald-700">{passRate}%</div>
                                <div className="text-xs text-emerald-600 font-medium">Pass Rate</div>
                            </div>
                        </div>

                        {/* Attempts List */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <h3 className="font-bold text-slate-700 mb-4">Exam History</h3>
                            {loadingAttempts ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                                    Loading exam history...
                                </div>
                            ) : studentAttempts.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    This student has not taken any exams yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {studentAttempts.map(attempt => (
                                        <div key={attempt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{attempt.exam?.title || 'Unknown Exam'}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {attempt.submitted_at 
                                                            ? new Date(attempt.submitted_at).toLocaleDateString() 
                                                            : 'Ongoing'}
                                                    </span>
                                                    {attempt.exam?.type && (
                                                        <span className={`uppercase font-bold px-1.5 py-0.5 rounded ${
                                                            attempt.exam.type === 'mock' ? 'bg-amber-100 text-amber-700' :
                                                            attempt.exam.type === 'test' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-indigo-100 text-indigo-700'
                                                        }`}>
                                                            {attempt.exam.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {attempt.status === 'submitted' ? (
                                                    <>
                                                        <div className={`text-2xl font-bold ${(attempt.score || 0) >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {attempt.score}%
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                                                            (attempt.score || 0) >= 50 ? 'text-emerald-600' : 'text-red-600'
                                                        }`}>
                                                            {(attempt.score || 0) >= 50 ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                            {(attempt.score || 0) >= 50 ? 'Passed' : 'Failed'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-amber-600 font-bold text-sm">Ongoing</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
