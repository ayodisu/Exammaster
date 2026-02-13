"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl, getAuthHeaders } from '@/config/api';
import { User as UserType } from '@/types';
import { Loader2, User, Mail, Shield, Phone, MapPin, Pencil, Save, X, Lock } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Edit form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(apiUrl('user'), {
                    headers: getAuthHeaders()
                });
                setUser(res.data);
                setFirstName(res.data.first_name || '');
                setLastName(res.data.last_name || '');
                setPhoneNumber(res.data.phone_number || '');
                setAddress(res.data.address || '');
            } catch {
                // error
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        setError('');
        setSuccess('');

        if (newPassword && newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSaving(true);
        try {
            const payload: Record<string, string> = {};
            if (firstName !== (user?.first_name || '')) payload.first_name = firstName;
            if (lastName !== (user?.last_name || '')) payload.last_name = lastName;
            if (phoneNumber !== (user?.phone_number || '')) payload.phone_number = phoneNumber;
            if (address !== (user?.address || '')) payload.address = address;
            if (newPassword) {
                payload.password = newPassword;
                payload.password_confirmation = confirmPassword;
            }

            const res = await axios.put(apiUrl('user/profile'), payload, {
                headers: getAuthHeaders()
            });
            setUser(res.data.user);
            setSuccess('Profile updated successfully!');
            setEditing(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.data.errors) {
                    setError(Object.values(err.response.data.errors).flat().join(' '));
                } else {
                    setError(err.response.data.message || 'Failed to update profile.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        setEditing(false);
        setError('');
        setFirstName(user?.first_name || '');
        setLastName(user?.last_name || '');
        setPhoneNumber(user?.phone_number || '');
        setAddress(user?.address || '');
        setNewPassword('');
        setConfirmPassword('');
    };

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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm"
                    >
                        <Pencil size={16} /> Edit Profile
                    </button>
                )}
            </div>

            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-xl border border-green-100">
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                </div>
            )}

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
                    {editing ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 font-medium mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 font-medium mb-1">Address</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>

                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                    <Lock size={14} /> Change Password <span className="text-slate-400 font-normal text-xs">(optional)</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 font-medium mb-1">New Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Leave blank to keep"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 font-medium mb-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Changes
                                </button>
                                <button
                                    onClick={cancelEdit}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
                                >
                                    <X size={16} /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
