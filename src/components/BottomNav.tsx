'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdHome, MdReceipt, MdBarChart, MdAccountCircle } from 'react-icons/md';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { name: 'Submit Iuran', path: '/', icon: MdReceipt },
        // { name: 'Keuangan', path: '/pengeluaran', icon: MdBarChart },
        { name: 'Iuran Bulanan', path: '/report-iuran', icon: MdBarChart },
        // { name: 'Profile', path: '/profile', icon: MdAccountCircle },
    ];

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
