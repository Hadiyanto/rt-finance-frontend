'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import {
    MdPictureAsPdf,
    MdChevronLeft,
    MdChevronRight,
} from 'react-icons/md';

interface RecapData {
    block: string;
    houseNumber: string;
    fullName: string;
    hasPaid: boolean;
    amount: number | null;
    status: string | null;
    date: string | null;
}

export default function RekapThrPage() {
    const [recap, setRecap] = useState<RecapData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/thr/rekap/${selectedYear}`
                );

                if (response.ok) {
                    const data = await response.json();
                    setRecap(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch THR recap:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedYear]);

    const goToPrevYear = () => {
        setSelectedYear(selectedYear - 1);
    };

    const goToNextYear = () => {
        setSelectedYear(selectedYear + 1);
    };

    // =======================
    // Helpers
    // =======================

    const renderAmount = (amount: number | null) => {
        if (amount === null || amount === 0) {
            return <span className="font-bold text-slate-400">-</span>;
        }
        return <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp {new Intl.NumberFormat('id-ID').format(amount)}</span>;
    };

    const renderStatus = (hasPaid: boolean, status: string | null) => {
        if (hasPaid && status === 'COMPLETED') {
            return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">Lunas</span>;
        } else if (status === 'PENDING') {
            return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 rounded-full dark:bg-amber-900/30 dark:text-amber-400">Pending</span>;
        } else {
            return <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 rounded-full dark:bg-slate-800 dark:text-slate-400">Belum</span>;
        }
    };

    // =======================
    // Totals
    // =======================

    const totalAmount = useMemo(() => {
        return recap.reduce((acc, item) => acc + (item.amount || 0), 0);
    }, [recap]);

    // Count paid residents
    const paidCount = recap.filter((r) => r.hasPaid && r.status === 'COMPLETED').length;
    const totalCount = recap.length;

    const downloadPDF = () => {
        const doc = new jsPDF('portrait');

        const title = `REKAP THR - TAHUN ${selectedYear}`;
        doc.setFontSize(14);
        doc.text(title, 14, 15);

        const tableColumn = [
            "Alamat",
            "Nama Penghuni",
            "Status",
            "Jumlah THR (Rp)"
        ];

        const tableRows: any[] = [];

        // ======================
        // DATA ROWS
        // ======================
        recap.forEach((item) => {
            let statusText = "Belum";
            if (item.hasPaid && item.status === 'COMPLETED') {
                statusText = "Lunas";
            } else if (item.status === 'PENDING') {
                statusText = "Pending";
            }

            tableRows.push([
                `${item.block} - ${item.houseNumber}`,
                item.fullName,
                statusText,
                item.amount ? new Intl.NumberFormat('id-ID').format(item.amount) : "-"
            ]);
        });

        // ===== TOTAL ROW =====
        tableRows.push([
            "TOTAL",
            "",
            `${paidCount} dari ${totalCount} Lunas`,
            new Intl.NumberFormat('id-ID').format(totalAmount)
        ]);

        // ======================
        // RENDER PDF TABLE
        // ======================
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 22,
            theme: "striped",

            styles: {
                fontSize: 9,
                cellPadding: 3,
                halign: "center"
            },

            headStyles: {
                fillColor: [15, 23, 42]
            },

            columnStyles: {
                0: { halign: "center" },
                1: { halign: "left" },
                2: { halign: "center" },
                3: { halign: "right" }
            },

            didParseCell: function (data) {
                const isTotalRow = data.row.index === tableRows.length - 1;

                if (isTotalRow) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = [220, 252, 231]; // emerald-50
                    if (data.column.index === 3) {
                        data.cell.styles.textColor = [5, 150, 105]; // emerald-600
                    }
                }
            }
        });

        doc.save(`Rekap-THR-${selectedYear}.pdf`);
    };

    const LoadingOverlay = () => {
        if (!isLoading) return null;

        return (
            <div className="fixed inset-0 z-[9999] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Memuat data THR...
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
                        Laporan THR
                    </h1>
                    <p className="text-sm text-slate-500">
                        {paidCount}/{totalCount} warga sudah bayar
                    </p>
                </div>
                <button
                    onClick={downloadPDF}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 
                        border border-rose-200 dark:border-slate-700 
                        text-rose-600 dark:text-rose-400 
                        text-xs font-semibold shadow-sm 
                        hover:bg-rose-50 dark:hover:bg-slate-700 
                        active:scale-95 transition"
                >
                    <MdPictureAsPdf className="text-sm" />
                    PDF
                </button>
            </header>

            <main className="px-5 space-y-6">
                {/* Year Selector */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={goToPrevYear}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <MdChevronLeft className="text-2xl" />
                    </button>

                    <div className="text-center">
                        <p className="font-bold text-lg">
                            Tahun {selectedYear}
                        </p>
                    </div>

                    <button
                        onClick={goToNextYear}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        disabled={selectedYear >= new Date().getFullYear() + 1}
                    >
                        <MdChevronRight className={`text-2xl ${selectedYear >= new Date().getFullYear() + 1 ? 'text-slate-300' : ''}`} />
                    </button>
                </div>

                {/* Total Recap Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                    <p className="text-emerald-50 font-medium mb-1">Total Terkumpul</p>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Rp {new Intl.NumberFormat('id-ID').format(totalAmount)}
                    </h2>
                </div>

                {/* Breakdown Table */}
                <section>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto no-scrollbar max-h-[60vh]">
                            <div className="min-w-[500px]">
                                {/* Sticky Header */}
                                <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                    <span className="col-span-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Block - No
                                    </span>
                                    <span className="col-span-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                        Status
                                    </span>
                                    <span className="col-span-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                                        Jumlah
                                    </span>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {recap.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-slate-500">
                                            Tidak ada data untuk tahun ini
                                        </div>
                                    ) : (
                                        <>
                                            {/* DATA ROWS */}
                                            {recap.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className={`
                                                        grid grid-cols-12 px-4 py-4 items-center
                                                        transition-colors
                                                        hover:bg-slate-100 dark:hover:bg-slate-700
                                                        ${index % 2 === 0
                                                            ? 'bg-white dark:bg-slate-800'
                                                            : 'bg-slate-50 dark:bg-slate-800/50'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex flex-col col-span-4">
                                                        <span className="text-xs font-bold text-slate-500">
                                                            {item.block} - {item.houseNumber}
                                                        </span>
                                                        <span className="text-sm font-semibold truncate pr-2">
                                                            {item.fullName}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-center col-span-4">
                                                        {renderStatus(item.hasPaid, item.status)}
                                                    </div>

                                                    <div className="flex justify-end col-span-4">
                                                        {renderAmount(item.amount)}
                                                    </div>
                                                </div>
                                            ))}
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
