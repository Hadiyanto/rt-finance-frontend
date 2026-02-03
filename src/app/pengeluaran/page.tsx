'use client';

import React, { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import { MdAdd, MdReceipt, MdArrowUpward, MdArrowDownward, MdTrendingUp, MdTrendingDown, MdWallet } from 'react-icons/md';

interface FinanceType {
    id: number;
    name: 'income' | 'expense';
}

interface FinanceCategory {
    id: number;
    name: string;
    typeId: number;
}

interface FinanceItem {
    id: number;
    amount: number;
    description: string;
    imageUrl: string | null;
    date: string;
    categoryId: number;
    typeId: number;
    category: FinanceCategory;
    type: FinanceType;
}

interface FinanceResponse {
    total: number;
    data: FinanceItem[];
}

export default function PengeluaranPage() {
    const [financeData, setFinanceData] = useState<FinanceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance`);
                if (response.ok) {
                    const data: FinanceResponse = await response.json();
                    // Sort by date descending (newest first)
                    const sortedData = data.data.sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setFinanceData(sortedData);
                }
            } catch (error) {
                console.error("Failed to fetch finance data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    // Calculate totals
    const { totalIncome, totalExpense, balance } = useMemo(() => {
        return financeData.reduce(
            (acc, item) => {
                if (item.type.name === 'income') {
                    acc.totalIncome += item.amount;
                    acc.balance += item.amount;
                } else {
                    acc.totalExpense += item.amount;
                    acc.balance -= item.amount;
                }
                return acc;
            },
            { totalIncome: 0, totalExpense: 0, balance: 0 }
        );
    }, [financeData]);

    const LoadingOverlay = () => {
        if (!isLoading) return null;

        return (
            <div className="fixed inset-0 z-[9999] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Memuat data keuangan...
                </p>
            </div>
        );
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-32 transition-colors duration-200 font-display">
            <LoadingOverlay />
            <div className="h-12 w-full bg-background-light dark:bg-background-dark sticky top-0 z-50"></div>

            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between sticky top-12 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Keuangan</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Laporan Kas RT</p>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30">
                    <MdAdd className="text-2xl" />
                </button>
            </header>

            <main className="px-5 space-y-6">
                {/* Summary Card - Balance */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <MdWallet className="text-2xl opacity-80" />
                        <span className="text-sm font-medium opacity-80">Sisa Saldo Kas</span>
                    </div>
                    <p className="text-3xl font-bold">Rp {formatCurrency(balance)}</p>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/20">
                        <div>
                            <div className="flex items-center gap-1 text-blue-100 text-xs mb-1">
                                <MdArrowUpward className="text-emerald-300" />
                                Pemasukan
                            </div>
                            <p className="font-semibold text-lg">Rp {formatCurrency(totalIncome)}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-blue-100 text-xs mb-1">
                                <MdArrowDownward className="text-rose-300" />
                                Pengeluaran
                            </div>
                            <p className="font-semibold text-lg">Rp {formatCurrency(totalExpense)}</p>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <section>
                    <h3 className="text-lg font-bold mb-4">Riwayat Transaksi</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                            <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</span>
                            <span className="col-span-12 md:col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:block">Deskripsi</span>
                            <span className="col-span-5 md:col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block md:hidden">Info</span>
                            <span className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Nominal</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {financeData.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-500">
                                    Belum ada data transaksi
                                </div>
                            ) : (
                                financeData.map((item) => {
                                    const isIncome = item.type.name === 'income';
                                    return (
                                        <div key={item.id} className="grid grid-cols-12 px-4 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="col-span-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        {formatDate(item.date)}
                                                    </span>
                                                    {/* Show category on mobile */}
                                                    <span className="text-[10px] text-slate-400 md:hidden mt-1 line-clamp-1">
                                                        {item.category?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-span-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2">
                                                        {item.description}
                                                    </span>
                                                    {/* Show category on desktop */}
                                                    <span className="text-xs text-slate-400 mt-0.5 hidden md:block">
                                                        {item.category?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-span-4 text-right">
                                                <span className={`text-sm font-bold ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {isIncome ? '+ ' : '- '}
                                                    Rp {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
