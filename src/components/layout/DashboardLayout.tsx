import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface MenuItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    menuItems: MenuItem[];
    roleLabel: string;
}

export default function DashboardLayout({ children, menuItems, roleLabel }: DashboardLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const verifyRole = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Safe LocalStorage Check
                const storedUser = localStorage.getItem('user');
                let user: any = null;
                
                if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
                    try {
                        user = JSON.parse(storedUser);
                    } catch (e) {
                         console.error("Failed to parse user from storage", e);
                         localStorage.removeItem('user'); // Clear bad data
                    }
                }

                if (user && user.role) {
                    if (user.role !== roleLabel) {
                        console.warn(`Role mismatch: Expected ${roleLabel}, got ${user.role}`);
                        if (user.role === 'student' || user.role === 'candidate') {
                             router.push('/student-dashboard'); 
                        } else if (user.role === 'examiner') {
                             router.push('/dashboard'); 
                        } else {
                             router.push('/login');
                        }
                        return;
                    }
                } else {
                    // Fallback: Fetch user from API if local storage is missing user data
                    try {
                        const res = await axios.get('http://localhost:8000/api/user', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const remoteUser = res.data;
                        localStorage.setItem('user', JSON.stringify(remoteUser));
                        
                        // Re-check role
                         if (remoteUser.role !== roleLabel) {
                            if (remoteUser.role === 'student' || remoteUser.role === 'candidate') {
                                 router.push('/student-dashboard'); 
                            } else if (remoteUser.role === 'examiner') {
                                 router.push('/dashboard'); 
                            } else {
                                 router.push('/login');
                            }
                            return;
                         }
                    } catch (err) {
                        console.error("Failed to fetch user profile", err);
                         localStorage.removeItem('token');
                         router.push('/login');
                         return;
                    }
                }

            } catch (error) {
                console.error("Auth check failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        verifyRole();
    }, [router, roleLabel]);

    if (isLoading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex fixed inset-y-0 left-0 z-50">
                <Sidebar 
                    menuItems={menuItems} 
                    roleLabel={roleLabel} 
                    collapsed={collapsed} 
                    toggleCollapse={() => setCollapsed(!collapsed)} 
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <div className="absolute top-2 right-2 z-50">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg">
                        <X size={20} />
                    </button>
                 </div>
                 <Sidebar 
                    menuItems={menuItems} 
                    roleLabel={roleLabel} 
                    collapsed={false} // Always expanded on mobile
                    toggleCollapse={() => {}} // No collapse on mobile
                 />
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <Header 
                    roleLabel={roleLabel} 
                    onMenuClick={() => setIsMobileMenuOpen(true)} 
                    collapsed={collapsed}
                />
                
                <main className="flex-1 p-6 mt-20 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                    {children}
                </main>

                <Footer />
            </div>
        </div>
    );
}
