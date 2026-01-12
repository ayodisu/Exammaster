"use client";

import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { apiUrl, APP_NAME, getAuthHeaders } from '@/config/api';
import { usePathname, useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/config/constants';

interface HeaderProps {
    roleLabel: string;
    onMenuClick: () => void;
    collapsed: boolean;
}

export default function Header({ roleLabel, onMenuClick, collapsed }: HeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [notifications] = useState(1);
    const router = useRouter();
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname === '/exams') return 'Dashboard';
        if (pathname === '/results') return 'My Results';
        if (pathname === '/profile') return 'My Profile';
        if (pathname.startsWith('/exam/')) return 'Assessment';
        if (pathname.includes('/dashboard')) return 'Overview';
        if (pathname.includes('/students')) return 'Student Management';
        return APP_NAME;
    };

    useEffect(() => {
        // Mock Notification Check
        // setNotifications(1); 
        
        // Fetch User Name
        const fetchUser = async () => {
            try {
                const res = await axios.get(apiUrl('user'), {
                    headers: getAuthHeaders()
                });
                if (res.data?.first_name) {
                    setUserName(res.data.first_name);
                } else if (res.data?.name) {
                    setUserName(res.data.name);
                }
            } catch {
                // ignore error, keep default
            }
        };
        fetchUser();
    }, []);

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

    return (
        <header className={`fixed top-0 right-0 z-40 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between transition-all duration-300 ${collapsed ? 'left-0 md:left-20' : 'left-0 md:left-64'}`}>
            <div className="flex items-center gap-4">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <div className="hidden md:block">
                     <span className="text-slate-400 text-sm font-medium">{roleLabel} Portal</span>
                     <h2 className="text-slate-800 font-bold text-xl">{getPageTitle()}</h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative group">
                    <Bell size={20} className={notifications > 0 ? 'animate-wiggle text-indigo-600' : ''} />
                    {notifications > 0 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>
                
                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors border border-transparent hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                            {roleLabel.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-bold text-slate-700 leading-none">{userName || 'My Account'}</p>
                            <span className="text-xs text-slate-400 capitalize">{roleLabel}</span>
                        </div>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-30 cursor-default" 
                                onClick={() => setIsProfileOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 bg-white py-2 animate-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-slate-100 mb-2">
                                    <p className="text-sm font-semibold text-slate-800">Signed in as</p>
                                    <p className="text-sm text-slate-500 truncate font-medium capitalize">{roleLabel}</p>
                                </div>
                                <Link 
                                    href="/profile" 
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 mx-2 rounded-lg transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User size={16} /> Profile
                                </Link>
                                <div className="h-px bg-slate-100 my-2 mx-4"></div>
                                <button 
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 mx-2 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
