"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';
import axios from 'axios';
import { apiUrl, APP_NAME, getAuthHeaders } from '@/config/api';
import { STORAGE_KEYS } from '@/config/constants';

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    const isHidden = ['/', '/student/login', '/student/register', '/examiner/login'].includes(pathname); // Determine visibility

    useEffect(() => {
        if (isHidden) return; // Don't fetch if hidden
        const fetchUser = async () => {
             try {
                const res = await axios.get(apiUrl('user'), {
                    headers: getAuthHeaders()
                });
                setUser(res.data);
            } catch {
                // Ignore error
            }
        };
        fetchUser();
    }, [pathname, isHidden]);

    const handleLogout = async () => {
        try {
            await axios.post(apiUrl('logout'), {}, {
                 headers: getAuthHeaders()
            });
        } catch (e) {
            console.error(e);
        }
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        router.push('/');
    };

    if (isHidden || !user) return null;

    const isExaminer = user.role === 'examiner'; // Check backend role value ('examiner' or 'admin'?)
    // Warning: Backend might use 'admin' or 'examiner'. I should check AuthController.
    // User migration said `enum('student', 'examiner')`.

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <Link href={isExaminer ? "/dashboard" : "/exams"} className="flex items-center gap-2 cursor-pointer">
                    <div className={`p-1.5 rounded-lg ${isExaminer ? 'bg-indigo-600' : 'bg-blue-600'} text-white`}>
                        <LayoutDashboard size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">
                        {APP_NAME} <span className={`text-xs px-2 py-0.5 rounded-full ${isExaminer ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>{isExaminer ? 'Examiner' : 'Candidate'}</span>
                    </h1>
                </Link>
                
                <div className="flex items-center gap-4">
                    {isExaminer && (
                        <Link href="/students" className="text-slate-500 hover:text-slate-800 font-medium">
                            Students
                        </Link>
                    )}
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <button 
                        onClick={handleLogout} 
                        className="text-slate-500 hover:text-red-600 flex items-center gap-2 font-medium text-sm px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}
