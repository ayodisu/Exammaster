"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User } from '@/types';
import { Search, User as UserIcon, Mail, Shield } from 'lucide-react';
import Link from 'next/link';

export default function StudentsPage() {
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/students', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
             <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Registered Candidates</h1>
                    <p className="text-slate-500 mt-2">Manage and view student profiles.</p>
                </div>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm">
                            <tr>
                                <th className="p-6 font-medium">Candidate</th>
                                <th className="p-6 font-medium">Contact</th>
                                <th className="p-6 font-medium">Role</th>
                                <th className="p-6 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading candidates...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No candidates found.</td></tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-800">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-slate-600 flex items-center gap-2">
                                            <Mail size={16} /> {student.email}
                                        </td>
                                        <td className="p-6">
                                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
                                                <UserIcon size={12} /> Student
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2"></span>
                                            <span className="text-slate-600 text-sm">Active</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
