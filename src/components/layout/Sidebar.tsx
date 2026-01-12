"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { APP_NAME, getAuthHeaders } from '@/config/api';
import axios from 'axios';
import { apiUrl } from '@/config/api';
import { STORAGE_KEYS } from '@/config/constants';

interface MenuItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

interface SidebarProps {
    menuItems: MenuItem[];
    roleLabel: string;
    collapsed: boolean;
    toggleCollapse: () => void;
}

export default function Sidebar({ menuItems, roleLabel, collapsed, toggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

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
        <aside className={`h-full bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'} overflow-hidden relative`}>
             {/* Toggle Button for Desktop */}
             <button 
                onClick={toggleCollapse}
                className="hidden md:flex absolute -right-3 top-24 bg-indigo-600 text-white p-1 rounded-full shadow-lg border-2 border-slate-900 z-50 hover:bg-indigo-500 transition-colors"
             >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
             </button>

            {/* Logo Section */}
            <div className={`flex items-center gap-3 p-6 border-b border-slate-800 h-20 transition-all duration-300 ${collapsed ? 'justify-center px-2' : ''}`}>
                <div className="bg-indigo-500 p-2 rounded-lg shrink-0">
                   <ShieldCheck size={24} className="text-white" />
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">{APP_NAME}</h1>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{roleLabel}</span>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            title={collapsed ? item.label : ''}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                isActive 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            } ${collapsed ? 'justify-center px-2' : ''}`}
                        >
                            <item.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                            <span className={`font-medium whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-slate-800">
                <button 
                    onClick={handleLogout}
                    title={collapsed ? "Sign Out" : ""}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed ? 'justify-center px-2' : ''}`}
                >
                    <LogOut size={20} className="shrink-0" />
                    <span className={`font-medium whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
