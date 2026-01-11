"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, X, Plus, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

export type EventType = 'exam' | 'mock' | 'test' | 'deadline';

export interface CalendarEvent {
    date: Date;
    title: string;
    type: EventType;
    id?: number | string;
    startTime?: string;
    description?: string;
}

interface CalendarProps {
    events?: CalendarEvent[];
    isAdmin?: boolean;
    onAddEvent?: (date: Date) => void;
    onViewEvent?: (eventId: number | string) => void;
}

export default function Calendar({ events = [], isAdmin = false, onAddEvent, onViewEvent }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (date: Date) => {
        const dayEvents = events.filter(e => e.date.toDateString() === date.toDateString());
        if (isAdmin || dayEvents.length > 0) {
            setSelectedDate(date);
            setIsModalOpen(true);
        }
    };

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 border border-slate-100"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = new Date().toDateString() === date.toDateString();
            const dayEvents = events.filter(e => e.date.toDateString() === date.toDateString());
            const hasEvents = dayEvents.length > 0;
            const isClickable = isAdmin || hasEvents;

            days.push(
                <div 
                    key={day} 
                    onClick={() => handleDateClick(date)}
                    className={`h-24 border border-slate-100 p-2 relative group transition-colors ${
                        isToday ? 'bg-indigo-50/30' : 'bg-white'
                    } ${isClickable ? 'cursor-pointer hover:bg-indigo-50/20' : 'cursor-default'}`}
                >
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                        {day}
                    </span>
                    
                    <div className="mt-1 space-y-1">
                        {dayEvents.map((event, idx) => {
                            let colorClass = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                            if (event.type === 'mock') colorClass = 'bg-amber-100 text-amber-700 border-amber-200';
                            if (event.type === 'test') colorClass = 'bg-purple-100 text-purple-700 border-purple-200';
                            
                            return (
                                <div key={idx} className={`text-xs px-1.5 py-0.5 rounded truncate font-medium border ${colorClass}`} title={event.title}>
                                    {event.title}
                                </div>
                            );
                        })}
                    </div>
                    
                    {isAdmin && (
                        <button 
                            className="absolute bottom-2 right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                            onClick={(e) => { e.stopPropagation(); onAddEvent?.(date); }}
                            title="Add Exam"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
            );
        }
        return days;
    };

    const selectedDayEvents = selectedDate 
        ? events.filter(e => e.date.toDateString() === selectedDate.toDateString())
        : [];

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={20} className="text-indigo-500"/>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 text-center bg-slate-50 border-b border-slate-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 bg-slate-100 gap-px border-b border-l border-slate-200">
                    {renderDays()}
                </div>
            </div>

            {isModalOpen && selectedDate && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                                <CalendarIcon size={20} className="text-indigo-600"/>
                                <span>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {selectedDayEvents.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 mb-4">No exams scheduled for this day.</p>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => { setIsModalOpen(false); onAddEvent?.(selectedDate); }}
                                            className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                                        >
                                            <Plus size={16} /> Schedule an Exam
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedDayEvents.map((event, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-900">{event.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                            event.type === 'mock' ? 'bg-amber-100 text-amber-700' :
                                                            event.type === 'test' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-indigo-100 text-indigo-700'
                                                        }`}>
                                                            {event.type}
                                                        </span>
                                                        {event.startTime && (
                                                             <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                                <Clock size={12}/> {event.startTime}
                                                             </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isAdmin && event.id && (
                                                    <button 
                                                        onClick={() => { setIsModalOpen(false); onViewEvent?.(event.id!); }}
                                                        className="shrink-0 px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-md"
                                                    >
                                                        <ExternalLink size={12} /> View
                                                    </button>
                                                )}
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                    
                                     {isAdmin && (
                                        <button 
                                            onClick={() => { setIsModalOpen(false); onAddEvent?.(selectedDate); }}
                                            className="w-full py-3 mt-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} /> Add Another Exam
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
