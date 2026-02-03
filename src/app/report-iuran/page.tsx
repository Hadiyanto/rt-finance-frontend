'use client';

import React, { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import {
    MdDescription,
    MdPictureAsPdf,
    MdChevronLeft,
    MdChevronRight,
} from 'react-icons/md';

interface BreakdownData {
    block: string;
    houseNumber: string;
    fullName: string;
    source: string | null;
    totalAmount: number | null;
    kasRT: number | null;
    agamaRT: number | null;
    sampah: number | null;
    keamanan: number | null;
    agamaRW: number | null;
    kasRW: number | null;
    kkmRW: number | null;
}

const MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

export default function ReportIuranPage() {
    const [breakdown, setBreakdown] = useState<BreakdownData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const monthStr = String(selectedMonth + 1).padStart(2, '0');
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee/breakdown/${selectedYear}/${monthStr}`
                );

                if (response.ok) {
                    const data = await response.json();
                    setBreakdown(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch breakdown:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedMonth, selectedYear]);

    const goToPrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    // =======================
    // Helpers
    // =======================

    const renderValue = (value: number | null) => {
        if (value === null) {
            return <span className="font-bold text-slate-400">-</span>;
        }
        return <span>{value}</span>;
    };

    // =======================
    // Totals
    // =======================

    const totals = useMemo(() => {
        return breakdown.reduce(
            (acc, item) => {
                acc.kasRT += item.kasRT || 0;
                acc.agamaRT += item.agamaRT || 0;
                acc.sampah += item.sampah || 0;
                acc.keamanan += item.keamanan || 0;
                acc.agamaRW += item.agamaRW || 0;
                acc.kasRW += item.kasRW || 0;
                acc.kkmRW += item.kkmRW || 0;
                return acc;
            },
            {
                kasRT: 0,
                agamaRT: 0,
                sampah: 0,
                keamanan: 0,
                agamaRW: 0,
                kasRW: 0,
                kkmRW: 0,
            }
        );
    }, [breakdown]);

    // =======================
    // Rekap Totals (Grouped)
    // =======================

    const rekap = useMemo(() => {
        return {
            kasRtGroup: totals.kasRT + totals.agamaRT,
            sampah: totals.sampah,
            keamananGroup:
                totals.keamanan + totals.agamaRW + totals.kasRW,
            kkmRW: totals.kkmRW,
        };
    }, [totals]);

    // Count paid residents
    const paidCount = breakdown.filter((r) => r.source !== null).length;
    const totalCount = breakdown.length;

    const LoadingOverlay = () => {
        if (!isLoading) return null;

        return (
            <div className="fixed inset-0 z-[9999] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Memuat data iuran...
                </p>
            </div>
        );
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-32 transition-colors duration-200 font-display">
            <LoadingOverlay />
            <div className="h-12 w-full bg-background-light dark:bg-background-dark sticky top-0 z-50"></div>

            <header className="px-5 py-4 flex items-center justify-between sticky top-12 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Laporan Iuran
                    </h1>
                    <p className="text-sm text-slate-500">
                        {paidCount}/{totalCount} warga sudah bayar
                    </p>
                </div>
            </header>

            <main className="px-5 space-y-6">
                {/* Month Selector */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={goToPrevMonth}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <MdChevronLeft className="text-2xl" />
                    </button>

                    <div className="text-center">
                        <p className="font-bold text-lg">
                            {MONTHS[selectedMonth]}
                        </p>
                        <p className="text-sm text-slate-500">
                            {selectedYear}
                        </p>
                    </div>

                    <button
                        onClick={goToNextMonth}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <MdChevronRight className="text-2xl" />
                    </button>
                </div>

                {/* Breakdown Table */}
                <section>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto no-scrollbar max-h-[60vh]">
                            <div className="min-w-[700px]">
                                {/* Sticky Header */}
                                <div className="grid grid-cols-8 bg-slate-100 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Alamat
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                        Kas RT
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                        Agama RT
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                        Sampah
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                        Keamanan
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                        Agama RW
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                        Kas RW
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                        KKM RW
                                    </span>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {breakdown.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-slate-500">
                                            Tidak ada data untuk periode ini
                                        </div>
                                    ) : (
                                        <>
                                            {/* DATA ROWS */}
                                            {breakdown.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className={`
                            grid grid-cols-8 px-4 py-4 items-center
                            transition-colors
                            hover:bg-slate-100 dark:hover:bg-slate-700
                            ${index % 2 === 0
                                                            ? 'bg-white dark:bg-slate-800'
                                                            : 'bg-slate-50 dark:bg-slate-800/50'
                                                        }
                          `}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-500">
                                                            {item.block} - {item.houseNumber}
                                                        </span>
                                                        <span className="text-sm font-semibold truncate">
                                                            {item.fullName}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-center">
                                                        {renderValue(item.kasRT)}
                                                    </div>
                                                    <div className="flex justify-center">
                                                        {renderValue(item.agamaRT)}
                                                    </div>
                                                    <div className="flex justify-center">
                                                        {renderValue(item.sampah)}
                                                    </div>
                                                    <div className="flex justify-center">
                                                        {renderValue(item.keamanan)}
                                                    </div>
                                                    <div className="flex justify-center">
                                                        {renderValue(item.agamaRW)}
                                                    </div>
                                                    <div className="flex justify-center">
                                                        {renderValue(item.kasRW)}
                                                    </div>
                                                    <div className="flex justify-center">
                                                        {renderValue(item.kkmRW)}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* REKAP ROW */}
                                            <div className="grid grid-cols-8 px-4 py-4 items-center bg-emerald-50 dark:bg-emerald-900/30 border-t-2 border-emerald-300 dark:border-emerald-700 font-bold">
                                                <div className="text-sm uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                                    Rekap Total Iuran
                                                </div>

                                                <div className="flex justify-center col-span-2">
                                                    {renderValue(rekap.kasRtGroup)}
                                                </div>

                                                <div className="flex justify-center">
                                                    {renderValue(rekap.sampah)}
                                                </div>

                                                <div className="flex justify-center col-span-3">
                                                    {renderValue(rekap.keamananGroup)}
                                                </div>

                                                <div className="flex justify-center">
                                                    {renderValue(rekap.kkmRW)}
                                                </div>
                                            </div>

                                            {/* SUM ROW */}
                                            <div className="grid grid-cols-8 px-4 py-4 items-center bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-600 font-bold">
                                                <div className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                    Total Per Kolom
                                                </div>

                                                <div className="flex justify-center">
                                                    {renderValue(totals.kasRT)}
                                                </div>
                                                <div className="flex justify-center">
                                                    {renderValue(totals.agamaRT)}
                                                </div>
                                                <div className="flex justify-center">
                                                    {renderValue(totals.sampah)}
                                                </div>
                                                <div className="flex justify-center">
                                                    {renderValue(totals.keamanan)}
                                                </div>
                                                <div className="flex justify-center">
                                                    {renderValue(totals.agamaRW)}
                                                </div>
                                                <div className="flex justify-center">
                                                    {renderValue(totals.kasRW)}
                                                </div>
                                                <div className="flex justify-center">
                                                    {renderValue(totals.kkmRW)}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
