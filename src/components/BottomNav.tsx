'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdHome, MdReceipt, MdBarChart, MdAccountCircle } from 'react-icons/md';

export default function BottomNav() {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            setIsLoggedIn(!!token);
        };

        checkAuth();

        // Listen for storage changes (e.g., login/logout in another tab)
        window.addEventListener('storage', checkAuth);

        // Custom event for login/logout in the same tab
        window.addEventListener('authChange', checkAuth);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('authChange', checkAuth);
        };
    }, []);

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    const baseNavItems = [
        { name: 'Submit Iuran', path: '/', icon: MdReceipt },
        { name: 'Iuran Bulanan', path: '/report-iuran', icon: MdBarChart },
        { name: 'Keuangan', path: '/pengeluaran', icon: MdBarChart },
    ];

    const navItems = isLoggedIn
        ? [...baseNavItems, { name: 'Profile', path: '/profile', icon: MdAccountCircle }]
        : baseNavItems;

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 flex justify-around items-center pt-3 pb-6 px-4 z-50">
            {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.name}
                        href={item.path}
                        className={`flex flex-col items-center gap-1 ${active
                            ? 'nav-item-active text-primary'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <Icon className="text-[28px]" />
                        <span className="text-[12px] font-semibold">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
