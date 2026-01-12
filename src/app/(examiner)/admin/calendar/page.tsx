"use client";

import React, { useState, useEffect } from 'react';
import Calendar, { CalendarEvent } from '@/components/Calendar';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { Exam } from '@/types';
import { useRouter } from 'next/navigation';

export default function ExaminerCalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await axios.get(apiUrl('assessments'), {
                    headers: getAuthHeaders()
                });
                
                const loadedExams: Exam[] = res.data;
                const mappedEvents: CalendarEvent[] = loadedExams
                    .filter(e => e.scheduled_at)
                    .map(e => ({
                        id: e.id,
                        date: new Date(e.scheduled_at!),
                        title: e.title,
                        type: e.type as 'exam' | 'mock' | 'test' | 'deadline'
                    }));
                
                setEvents(mappedEvents);
            } catch (error) {
                console.error("Failed to fetch calendar events", error);
            }
        };

        fetchExams();
    }, []);

    const handleAddEvent = (date: Date) => {
        // Use local date instead of UTC to prevent off-by-one error
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        router.push(`/admin/exams/create?date=${dateStr}&returnTo=calendar`);
    };

    const handleViewEvent = (eventId: number | string) => {
        router.push(`/admin/exams/${eventId}`);
    };

    return (
        <div className="p-8 min-h-screen bg-slate-50 text-slate-900 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Assessment Schedule</h1>
                    <p className="text-slate-500 mt-2">View and manage assessment dates.</p>
                </div>
                <Link 
                    href="/admin/exams/create?returnTo=calendar"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    <Plus size={20} /> Schedule Assessment
                </Link>
            </div>

            <Calendar 
                events={events} 
                isAdmin={true}
                onAddEvent={handleAddEvent}
                onViewEvent={handleViewEvent}
            />
        </div>
    );
}
