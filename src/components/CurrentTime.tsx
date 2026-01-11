"use client";

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CurrentTime() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-2 text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-sm font-medium">
            <Clock size={16} className="text-indigo-500" />
            <span>
                {time.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}
            </span>
            <span className="w-px h-4 bg-slate-300 mx-1"></span>
            <span className="tabular-nums">
                {time.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
            </span>
        </div>
    );
}
