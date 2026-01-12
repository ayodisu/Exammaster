import React from 'react';
import { APP_NAME } from '@/config/api';

export default function Footer() {
    return (
        <footer className="py-6 px-8 text-center text-sm text-slate-400 border-t border-slate-200 mt-auto bg-slate-50">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </footer>
    );
}
