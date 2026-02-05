'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import NotificationSettings from '@/components/NotificationSettings';
import WhatsAppManager from '@/components/WhatsAppManager';
import { MdArrowBack, MdPerson, MdHome, MdPhone, MdEdit, MdLogout, MdCheckCircle, MdWarning } from 'react-icons/md';

interface User {
    id: number;
    name: string;
    role: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Get user from localStorage or sessionStorage
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (error) {
                console.error('Failed to parse user data:', error);
                router.push('/');
            }
        } else {
            // No user logged in, redirect to home
            router.push('/');
        }
    }, [router]);

    const handleLogout = () => {
        // Clear both localStorage and sessionStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // Dispatch event to notify other components
        window.dispatchEvent(new Event('authChange'));

        // Redirect to home
        router.push('/');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col max-w-[430px] mx-auto bg-white dark:bg-background-dark shadow-xl overflow-x-hidden pb-24">
            {/* TopAppBar */}
            <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
                <div
                    onClick={() => router.push('/')}
                    className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center justify-start cursor-pointer"
                >
                    <MdArrowBack className="text-2xl" />
                </div>
                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                    Profil Pengguna
                </h2>
            </div>

            {/* ProfileHeader */}
            <div className="flex p-4 mt-4">
                <div className="flex w-full flex-col gap-4 items-center">
                    <div className="flex gap-4 flex-col items-center">
                        {/* Avatar Placeholder */}
                        <div className="bg-gradient-to-br from-primary to-primary/70 rounded-full min-h-32 w-32 border-4 border-primary/10 flex items-center justify-center">
                            <MdPerson className="text-white text-6xl" />
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <p className="text-[#111418] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">
                                {user.name}
                            </p>
                            <p className="text-[#617589] dark:text-gray-400 text-sm font-normal leading-normal text-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full mt-2 uppercase">
                                {user.role}
                            </p>
                            <p className="text-[#617589] dark:text-gray-400 text-xs font-normal leading-normal text-center mt-1">
                                ID: {user.id}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Title */}
            <div className="px-4 py-2 mt-4">
                <h3 className="text-[#111418] dark:text-white text-sm font-bold uppercase tracking-wider">
                    Informasi Akun
                </h3>
            </div>

            {/* Personal Info List */}
            <div className="flex flex-col">
                {/* ListItem: Full Name */}
                <div className="flex items-center gap-4 bg-white dark:bg-background-dark px-4 min-h-[72px] py-2 justify-between border-b border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                            <MdPerson className="text-2xl" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-[#111418] dark:text-white text-base font-medium leading-normal line-clamp-1">
                                Nama Lengkap
                            </p>
                            <p className="text-[#617589] dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">
                                {user.name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ListItem: Role */}
                <div className="flex items-center gap-4 bg-white dark:bg-background-dark px-4 min-h-[72px] py-2 justify-between border-b border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                            <MdHome className="text-2xl" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-[#111418] dark:text-white text-base font-medium leading-normal line-clamp-1">
                                Role
                            </p>
                            <p className="text-[#617589] dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2 uppercase">
                                {user.role}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ListItem: User ID */}
                <div className="flex items-center gap-4 bg-white dark:bg-background-dark px-4 min-h-[72px] py-2 justify-between border-b border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                            <MdPhone className="text-2xl" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-[#111418] dark:text-white text-base font-medium leading-normal line-clamp-1">
                                User ID
                            </p>
                            <p className="text-[#617589] dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">
                                {user.id}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="p-4">
                <NotificationSettings />
            </div>

            {/* WhatsApp Manager - Admin Only */}
            {user && (user.role === 'admin' || user.role === 'bendahara') && (
                <div className="p-4">
                    <WhatsAppManager />
                </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 flex flex-col gap-3 mt-6">
                {/* Approval Iuran Button */}
                <button
                    onClick={() => router.push('/approval-iuran')}
                    className="w-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                    <MdCheckCircle className="text-xl" />
                    Approval Iuran
                </button>

                {/* Laporan Tunggakan Button - Admin Only */}
                {user && (user.role === 'admin' || user.role === 'bendahara') && (
                    <button
                        onClick={() => router.push('/unpaid-residents')}
                        className="w-full bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                        <MdWarning className="text-xl" />
                        Laporan Tunggakan
                    </button>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                    <MdLogout className="text-xl" />
                    Keluar Sesi
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
