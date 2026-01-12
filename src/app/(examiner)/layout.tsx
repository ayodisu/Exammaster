"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LayoutDashboard, Users, Activity, FileText, Calendar, BarChart2 } from 'lucide-react';
import { ROLES } from '@/config/constants';

export default function ExaminerLayout({ children }: { children: React.ReactNode }) {
    const menuItems = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Exams', href: '/admin/exams', icon: FileText }, 
        { label: 'Calendar', href: '/admin/calendar', icon: Calendar },
        { label: 'Stats', href: '/admin/stats', icon: BarChart2 },
        { label: 'Students', href: '/students', icon: Users },
        { label: 'Live Monitor', href: '/live-monitor', icon: Activity },
    ];

    return (
        <DashboardLayout menuItems={menuItems} roleLabel={ROLES.EXAMINER}>
            {children}
        </DashboardLayout>
    );
}
