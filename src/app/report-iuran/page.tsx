'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import { MdPictureAsPdf, MdChevronLeft, MdChevronRight, MdExpandMore, MdSearch } from 'react-icons/md';
import { api, formatRupiah, MONTHS_LONG as MONTHS } from '@/lib/api';

interface BreakdownData {
    houseId: number;
    block: string;
    houseNumber: string;
    fullName: string | null;
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

type ComponentKey = 'kasRT' | 'agamaRT' | 'sampah' | 'keamanan' | 'agamaRW' | 'kasRW' | 'kkmRW';

const COMPONENTS: { key: ComponentKey; label: string }[] = [
    { key: 'kasRT', label: 'Kas RT' },
    { key: 'agamaRT', label: 'Agama RT' },
    { key: 'sampah', label: 'Sampah' },
    { key: 'keamanan', label: 'Keamanan' },
    { key: 'agamaRW', label: 'Agama RW' },
    { key: 'kasRW', label: 'Kas RW' },
    { key: 'kkmRW', label: 'KKM RW' },
];

type Filter = 'all' | 'paid' | 'unpaid';

export default function ReportIuranPage() {
    const [breakdown, setBreakdown] = useState<BreakdownData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState<number | null>(null);
    const [showComponents, setShowComponents] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const monthStr = String(selectedMonth + 1).padStart(2, '0');
        api<{ data: BreakdownData[] }>(`/api/public/reports/fee-breakdown?period=${selectedYear}-${monthStr}`)
            .then((data) => !cancelled && setBreakdown(data.data))
            .catch((error) => console.error('Failed to fetch breakdown:', error))
            .finally(() => !cancelled && setIsLoading(false));
        return () => {
            cancelled = true;
        };
    }, [selectedMonth, selectedYear]);

    const changeMonth = (delta: number) => {
        const index = selectedYear * 12 + selectedMonth + delta;
        setIsLoading(true);
        setExpanded(null);
        setSelectedYear(Math.floor(index / 12));
        setSelectedMonth(index % 12);
    };

    // =======================
    // Totals
    // =======================

    const totals = useMemo(() => {
        const sum = Object.fromEntries(COMPONENTS.map((c) => [c.key, 0])) as Record<ComponentKey, number>;
        for (const item of breakdown) {
            for (const c of COMPONENTS) sum[c.key] += item[c.key] || 0;
        }
        return sum;
    }, [breakdown]);

    // kelompok setoran (sama seperti rekap di PDF)
    const rekap = useMemo(
        () => [
            { label: 'Kas + Agama RT', amount: totals.kasRT + totals.agamaRT },
            { label: 'Sampah', amount: totals.sampah },
            { label: 'Keamanan + Agama RW + Kas RW', amount: totals.keamanan + totals.agamaRW + totals.kasRW },
            { label: 'KKM RW', amount: totals.kkmRW },
        ],
        [totals]
    );

    const paid = breakdown.filter((r) => r.source !== null);
    const paidCount = paid.length;
    const totalCount = breakdown.length;
    const grandTotal = paid.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const progress = totalCount ? Math.round((paidCount / totalCount) * 100) : 0;

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return breakdown.filter((r) => {
            if (filter === 'paid' && r.source === null) return false;
            if (filter === 'unpaid' && r.source !== null) return false;
            if (!q) return true;
            return `${r.block}/${r.houseNumber}`.toLowerCase().includes(q) || (r.fullName ?? '').toLowerCase().includes(q);
        });
    }, [breakdown, filter, query]);

    const downloadPDF = () => {
        const doc = new jsPDF('portrait');

        const title = `REKAP TOTAL IURAN - ${MONTHS[selectedMonth]} ${selectedYear}`;
        doc.setFontSize(14);
        doc.text(title, 14, 15);

        const tableColumn = [
            "Alamat",
            "Nama",
            "Kas RT",
            "Agama RT",
            "Sampah",
            "Keamanan",
            "Agama RW",
            "Kas RW",
            "KKM RW"
        ];

        const tableRows: any[] = [];

        // ======================
        // DATA ROWS
        // ======================
        breakdown.forEach((item) => {
            tableRows.push([
                `${item.block} - ${item.houseNumber}`,
                item.fullName,
                item.kasRT ?? "-",
                item.agamaRT ?? "-",
                item.sampah ?? "-",
                item.keamanan ?? "-",
                item.agamaRW ?? "-",
                item.kasRW ?? "-",
                item.kkmRW ?? "-"
            ]);
        });

        // ======================
        // SUM PER KOLOM
        // ======================
        const sum = {
            kasRT: 0,
            agamaRT: 0,
            sampah: 0,
            keamanan: 0,
            agamaRW: 0,
            kasRW: 0,
            kkmRW: 0
        };

        breakdown.forEach(r => {
            sum.kasRT += r.kasRT || 0;
            sum.agamaRT += r.agamaRT || 0;
            sum.sampah += r.sampah || 0;
            sum.keamanan += r.keamanan || 0;
            sum.agamaRW += r.agamaRW || 0;
            sum.kasRW += r.kasRW || 0;
            sum.kkmRW += r.kkmRW || 0;
        });

        // ======================
        // REKAP TOTAL (GROUPED)
        // ======================
        const rekapPDF = {
            kasRtGroup: sum.kasRT + sum.agamaRT,
            sampah: sum.sampah,
            keamananGroup: sum.keamanan + sum.agamaRW + sum.kasRW,
            kkmRW: sum.kkmRW
        };

        // ===== REKAP ROW =====
        tableRows.push([
            "REKAP TOTAL IURAN",
            "",
            `Kas + Agama RT: ${rekapPDF.kasRtGroup}`,
            "",
            `Sampah: ${rekapPDF.sampah}`,
            `Keamanan + Agama RW + Kas RW: ${rekapPDF.keamananGroup}`,
            "",
            "",
            `KKM RW: ${rekapPDF.kkmRW}`
        ]);

        // ===== TOTAL ROW =====
        tableRows.push([
            "TOTAL PER KOLOM",
            "",
            sum.kasRT,
            sum.agamaRT,
            sum.sampah,
            sum.keamanan,
            sum.agamaRW,
            sum.kasRW,
            sum.kkmRW
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
                fontSize: 8,
                cellPadding: 2,
                halign: "center"
            },

            headStyles: {
                fillColor: [15, 23, 42]
            },

            didParseCell: function (data) {
                const isRekapRow = data.row.index === tableRows.length - 2;
                const isTotalRow = data.row.index === tableRows.length - 1;

                if (isRekapRow || isTotalRow) {
                    data.cell.styles.fontStyle = "bold";
                }
            },

            willDrawCell: function (data) {
                const isRekapRow = data.row.index === tableRows.length - 2;

                if (isRekapRow) {
                    data.cell.styles.fillColor = [220, 252, 231]; // emerald-50
                }
            }
        });

        doc.save(`Rekap-Iuran-${MONTHS[selectedMonth]}-${selectedYear}.pdf`);
    };

    const FILTERS: { key: Filter; label: string; count: number }[] = [
        { key: 'all', label: 'Semua', count: totalCount },
        { key: 'paid', label: 'Lunas', count: paidCount },
        { key: 'unpaid', label: 'Belum', count: totalCount - paidCount },
    ];

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-32 font-display">
            <div className="max-w-[430px] mx-auto">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 pt-4 pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold tracking-tight">Laporan Iuran</h1>
                        <button
                            onClick={downloadPDF}
                            disabled={isLoading || breakdown.length === 0}
                            className="flex items-center gap-1 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 text-sm font-semibold active:scale-95 disabled:opacity-50"
                        >
                            <MdPictureAsPdf /> PDF
                        </button>
                    </div>

                    {/* Pilih bulan */}
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl px-1 py-1 border border-slate-200 dark:border-slate-700">
                        <button onClick={() => changeMonth(-1)} className="w-11 h-11 flex items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-700" aria-label="Bulan sebelumnya">
                            <MdChevronLeft className="text-2xl" />
                        </button>
                        <p className="font-bold text-base">
                            {MONTHS[selectedMonth]} {selectedYear}
                        </p>
                        <button onClick={() => changeMonth(1)} className="w-11 h-11 flex items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-700" aria-label="Bulan berikutnya">
                            <MdChevronRight className="text-2xl" />
                        </button>
                    </div>
                </header>

                <main className="px-4 space-y-4">
                    {isLoading ? (
                        <div className="space-y-3" aria-label="Memuat data iuran">
                            <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        </div>
                    ) : (
                        <>
                            {/* Ringkasan */}
                            <section className="rounded-2xl p-4 bg-primary text-white shadow-sm">
                                <p className="text-sm text-white/80">Total terkumpul</p>
                                <p className="text-3xl font-bold tracking-tight mt-0.5">{formatRupiah(grandTotal)}</p>
                                <div className="mt-3 h-2 rounded-full bg-white/25 overflow-hidden">
                                    <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-sm text-white/90 mt-1.5">
                                    {paidCount} dari {totalCount} rumah lunas
                                </p>
                            </section>

                            {/* Rekap setoran */}
                            <section className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                                <h2 className="font-bold mb-3">Rekap setoran</h2>
                                <div className="grid grid-cols-2 gap-2">
                                    {rekap.map((r) => (
                                        <div key={r.label} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{r.label}</p>
                                            <p className="font-bold mt-1">{formatRupiah(r.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowComponents((v) => !v)}
                                    className="mt-3 w-full flex items-center justify-between text-sm font-semibold text-primary py-1"
                                    aria-expanded={showComponents}
                                >
                                    Rincian per komponen
                                    <MdExpandMore className={`text-xl transition-transform ${showComponents ? 'rotate-180' : ''}`} />
                                </button>
                                {showComponents && (
                                    <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
                                        {COMPONENTS.map((c) => (
                                            <div key={c.key} className="flex justify-between py-2 text-sm">
                                                <dt className="text-slate-500 dark:text-slate-400">{c.label}</dt>
                                                <dd className="font-semibold">{formatRupiah(totals[c.key])}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                            </section>

                            {/* Daftar rumah */}
                            <section className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="p-3 space-y-3 border-b border-slate-100 dark:border-slate-700">
                                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900">
                                        {FILTERS.map((f) => (
                                            <button
                                                key={f.key}
                                                onClick={() => setFilter(f.key)}
                                                aria-pressed={filter === f.key}
                                                className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
                                                    filter === f.key ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                            >
                                                {f.label} ({f.count})
                                            </button>
                                        ))}
                                    </div>
                                    <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary">
                                        <MdSearch className="text-xl text-slate-400" />
                                        <input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Cari blok atau nama"
                                            className="flex-1 bg-transparent outline-none text-base"
                                        />
                                    </label>
                                </div>

                                {visible.length === 0 ? (
                                    <p className="p-6 text-center text-sm text-slate-500">Tidak ada rumah yang cocok</p>
                                ) : (
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {visible.map((item) => {
                                            const isPaid = item.source !== null;
                                            const isOpen = expanded === item.houseId;
                                            return (
                                                <li key={item.houseId}>
                                                    <button
                                                        onClick={() => isPaid && setExpanded(isOpen ? null : item.houseId)}
                                                        aria-expanded={isPaid ? isOpen : undefined}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                                    >
                                                        <span className="w-14 shrink-0 text-sm font-bold text-slate-500 dark:text-slate-400">
                                                            {item.block}/{item.houseNumber}
                                                        </span>
                                                        <span className="flex-1 min-w-0 truncate font-medium">{item.fullName ?? '-'}</span>
                                                        {isPaid ? (
                                                            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                                {formatRupiah(item.totalAmount || 0)}
                                                                <MdExpandMore className={`text-lg text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                                Belum
                                                            </span>
                                                        )}
                                                    </button>
                                                    {isOpen && (
                                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 pb-3 text-sm">
                                                            {COMPONENTS.filter((c) => item[c.key]).map((c) => (
                                                                <div key={c.key} className="flex justify-between">
                                                                    <dt className="text-slate-500 dark:text-slate-400">{c.label}</dt>
                                                                    <dd className="font-medium">{formatRupiah(item[c.key] || 0)}</dd>
                                                                </div>
                                                            ))}
                                                        </dl>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>
                        </>
                    )}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
