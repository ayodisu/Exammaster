"use client";

import React, { useState, useEffect } from 'react';
import Calendar, { CalendarEvent } from '@/components/Calendar';
import axios from 'axios';
import { Exam } from '@/types';

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [upcomingCount, setUpcomingCount] = useState(0);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:8000/api/exams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const loadedExams: Exam[] = res.data;
                const now = new Date();
                
                const mappedEvents: CalendarEvent[] = loadedExams
                    .filter(e => e.scheduled_at && e.is_active)
                    .map(e => ({
                        date: new Date(e.scheduled_at!),
                        title: e.title,
                        type: e.type as 'exam' | 'mock' | 'test' | 'deadline'
                    }));
                
                setEvents(mappedEvents);
                setUpcomingCount(mappedEvents.filter(e => e.date >= now).length);
            } catch (error) {
                console.error("Failed to fetch calendar events", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, []);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Academic Calendar</h1>
                <p className="text-slate-500">Track your upcoming exams and important dates.</p>
            </div>
            
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading calendar...</div>
            ) : (
                <Calendar events={events} />
            )}
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                    <h3 className="font-semibold text-indigo-900 mb-1">Upcoming Exams</h3>
                    <p className="text-sm text-indigo-700">
                        {upcomingCount > 0 
                            ? `You have ${upcomingCount} exam${upcomingCount > 1 ? 's' : ''} scheduled.`
                            : 'No upcoming exams scheduled.'
                        }
                    </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <h3 className="font-semibold text-slate-800 mb-1">How to Use</h3>
                    <p className="text-sm text-slate-600">Click on any highlighted day to view exam details.</p>
                </div>
            </div>
        </div>
    );
}
