"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User as UserType } from '@/types';
import { Loader2, User, Mail, Shield, Phone, MapPin } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
             try {
                const res = await axios.get('http://localhost:8000/api/user', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setUser(res.data);
            } catch {
                // error
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 relative">
                    <div className="absolute -bottom-10 left-8">
                        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                                {user.first_name ? user.first_name.charAt(0) : <User />}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="pt-14 px-8 pb-8">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {user.first_name} {user.last_name}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                        <Shield size={16} className="text-indigo-500" />
                        <span className="capitalize font-medium">{user.role}</span>
                        {user.exam_number && (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono ml-2">
                                {user.exam_number}
                            </span>
                        )}
                    </div>

                    <div className="mt-8 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Information</h3>
                        
                        <div className="flex items-center gap-4 text-slate-600">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                <Mail size={20} className="text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Email Address</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                        </div>

                        {user.phone_number && (
                            <div className="flex items-center gap-4 text-slate-600">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                    <Phone size={20} className="text-slate-400" />
                                </div>
                                <div>
                                     <p className="text-xs text-slate-400 font-medium">Phone Number</p>
                                    <p className="font-medium">{user.phone_number}</p>
                                </div>
                            </div>
                        )}
                        
                         {user.address && (
                            <div className="flex items-center gap-4 text-slate-600">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                    <MapPin size={20} className="text-slate-400" />
                                </div>
                                <div>
                                     <p className="text-xs text-slate-400 font-medium">Address</p>
                                    <p className="font-medium">{user.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
