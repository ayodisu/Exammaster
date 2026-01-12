"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookOpen, FileText, BarChart3, Clock, Home, Calendar } from 'lucide-react';
import { ROLES } from '@/config/constants';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const menuItems = [
        { label: 'Dashboard', href: '/student-dashboard', icon: Home },
        { label: 'My Assessments', href: '/exams', icon: BookOpen },
        { label: 'Results', href: '/results', icon: BarChart3 },
        { label: 'Calendar', href: '/calendar', icon: Calendar },
        { label: 'Profile', href: '/profile', icon: Home },
    ];

    return (
        <DashboardLayout menuItems={menuItems} roleLabel={ROLES.CANDIDATE}>
            {children}
        </DashboardLayout>
    );
}
