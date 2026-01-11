"use client";

import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function AlertModal({ 
    isOpen, onClose, title, message, type = 'info',
    onConfirm, confirmText = 'Okay', cancelText = 'Cancel' 
}: AlertModalProps) {
    if (!isOpen) return null;

    const typeStyles = {
        success: {
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            button: 'bg-emerald-600 hover:bg-emerald-700',
            icon: CheckCircle
        },
        error: {
            bg: 'bg-red-50',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700',
            icon: AlertCircle
        },
        info: {
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700',
            icon: Info
        },
        warning: {
            bg: 'bg-amber-50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700',
            icon: AlertCircle
        }
    };

    const style = typeStyles[type];
    const Icon = style.icon;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${style.iconBg} ${style.iconColor}`}>
                        <Icon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 mb-6">{message}</p>
                    
                    <div className="flex gap-3">
                        {onConfirm && (
                            <button 
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button 
                            onClick={onConfirm || onClose}
                            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${style.button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
