'use client';

import React, { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import { MdAdd, MdReceipt } from 'react-icons/md';

interface ExpenseData {
    id: number;
    date: string;
    description: string;
    nominal: number;
}

// Dummy data - replace with API call later
const dummyExpenses: ExpenseData[] = [
    { id: 1, date: '2026-02-01', description: 'Bayar satpam bulan Februari', nominal: 2500000 },
    { id: 2, date: '2026-02-01', description: 'Pembelian lampu jalan blok A', nominal: 350000 },
    { id: 3, date: '2026-01-28', description: 'Perbaikan pagar taman', nominal: 500000 },
    { id: 4, date: '2026-01-25', description: 'Bayar tukang sampah bulan Januari', nominal: 1200000 },
    { id: 5, date: '2026-01-20', description: 'Pembelian cat untuk pos satpam', nominal: 275000 },
    { id: 6, date: '2026-01-15', description: 'Bayar listrik lampu jalan', nominal: 450000 },
    { id: 7, date: '2026-01-10', description: 'Pembelian tanaman taman', nominal: 180000 },
    { id: 8, date: '2026-01-05', description: 'Perbaikan pompa air taman', nominal: 650000 },
];

export default function PengeluaranPage() {
    const [expenses, setExpenses] = useState<ExpenseData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        const fetchData = async () => {
            try {
                // TODO: Replace with actual API call
                // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`);
                // const data = await response.json();
                // setExpenses(data.data);

                // Using dummy data for now
                setTimeout(() => {
                    setExpenses(dummyExpenses);
                    setIsLoading(false);
                }, 500);
            } catch (error) {
                console.error("Failed to fetch expenses:", error);
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

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.nominal, 0);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-32 transition-colors duration-200 font-display">
            <div className="h-12 w-full bg-background-light dark:bg-background-dark sticky top-0 z-50"></div>

            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between sticky top-12 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pengeluaran</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Daftar pengeluaran RT</p>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30">
                    <MdAdd className="text-2xl" />
                </button>
            </header>

            <main className="px-5 space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <MdReceipt className="text-2xl opacity-80" />
                        <span className="text-sm font-medium opacity-80">Total Pengeluaran</span>
                    </div>
                    <p className="text-3xl font-bold">Rp {formatCurrency(totalExpenses)}</p>
                    <p className="text-sm opacity-80 mt-1">{expenses.length} transaksi</p>
                </div>

                {/* Expenses Table */}
                <section>
                    <h3 className="text-lg font-bold mb-4">Riwayat Pengeluaran</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                            <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</span>
                            <span className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi</span>
                            <span className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Nominal</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {isLoading ? (
                                <div className="px-4 py-8 text-center text-slate-500">
                                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                                    Loading data...
                                </div>
                            ) : expenses.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-500">
                                    Belum ada data pengeluaran
                                </div>
                            ) : (
                                expenses.map((expense) => (
                                    <div key={expense.id} className="grid grid-cols-12 px-4 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="col-span-3">
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {formatDate(expense.date)}
                                            </span>
                                        </div>
                                        <div className="col-span-5">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2">
                                                {expense.description}
                                            </span>
                                        </div>
                                        <div className="col-span-4 text-right">
                                            <span className="text-sm font-bold text-rose-500">
                                                Rp {formatCurrency(expense.nominal)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
