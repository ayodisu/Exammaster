"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LayoutDashboard, Users, FileText, Calendar, BarChart2, Shield } from 'lucide-react';
import { ROLES, STORAGE_KEYS } from '@/config/constants';

export default function ExaminerLayout({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.USER);
        if (stored) {
            const user = JSON.parse(stored);
            setIsAdmin(!!user.is_admin);
        }
    }, []);

    const menuItems = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Assessments', href: '/admin/exams', icon: FileText },
        { label: 'Calendar', href: '/admin/calendar', icon: Calendar },
        { label: 'Stats', href: '/admin/stats', icon: BarChart2 },
        { label: 'Students', href: '/students', icon: Users },
        ...(isAdmin ? [{ label: 'Super Admin', href: '/super-admin', icon: Shield }] : []),
    ];

    return (
        <DashboardLayout menuItems={menuItems} roleLabel={ROLES.EXAMINER}>
            {children}
        </DashboardLayout>
    );
}