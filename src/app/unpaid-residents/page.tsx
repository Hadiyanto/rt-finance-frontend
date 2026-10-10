'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MdFileDownload, MdArrowBack, MdWhatsapp } from 'react-icons/md';
import { api, errorMessage, formatPeriod, formatRupiah, getToken } from '@/lib/api';

interface ArrearsRow {
    houseId: number;
    block: string;
    houseNumber: string;
    fullName: string | null;
    phoneNumber: string | null;
    houseStatus: 'OCCUPIED' | 'VACANT' | null;
    billedMonths: number;
    paidMonths: number;
    pendingMonths: number;
    unpaidMonths: number;
    unpaidPeriods: string[];
    unpaidAmount: number;
}

interface ArrearsResponse {
    startMonth: string;
    endMonth: string;
    totalHouses: number;
    housesWithUnpaid: number;
    totalUnpaidAmount: number;
    data: ArrearsRow[];
}

const MESSAGE_TEMPLATES = {
    reminder: `Kepada Bapak/Ibu [NAMA] ([RUMAH]),

Kami ingin mengingatkan bahwa terdapat tunggakan iuran RT sebanyak [BULAN] bulan ([DAFTAR_BULAN]), total [NOMINAL].

Mohon segera melakukan pembayaran. Terima kasih atas perhatian dan kerjasamanya.

Hormat kami,
Pengurus RT`,
    gentle: `Halo Bapak/Ibu [NAMA],

Semoga sehat selalu. Kami ingin mengingatkan bahwa masih ada tunggakan iuran RT untuk [RUMAH] sebanyak [BULAN] bulan ([DAFTAR_BULAN]).

Jika sudah dibayar, mohon informasikan kepada kami. Jika belum, kami tunggu pembayarannya ya.

Terima kasih 🙏`,
    urgent: `PENTING - Reminder Iuran RT

Kepada: Bapak/Ibu [NAMA] ([RUMAH])
Tunggakan: [BULAN] bulan ([DAFTAR_BULAN])
Total: [NOMINAL]

Mohon segera melakukan pembayaran untuk menghindari penumpukan tunggakan lebih lanjut.`,
};

type TemplateKey = keyof typeof MESSAGE_TEMPLATES;

// 0812… → 62812… (format wa.me)
function toWaNumber(phone: string) {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

function personalize(template: string, r: ArrearsRow) {
    return template
        .replace(/\[NAMA\]/g, r.fullName ?? '')
        .replace(/\[RUMAH\]/g, `${r.block}/${r.houseNumber}`)
        .replace(/\[BULAN\]/g, String(r.unpaidMonths))
        .replace(/\[DAFTAR_BULAN\]/g, r.unpaidPeriods.map((p) => formatPeriod(p)).join(', '))
        .replace(/\[NOMINAL\]/g, formatRupiah(r.unpaidAmount));
}

export default function UnpaidResidentsPage() {
    const router = useRouter();
    const [data, setData] = useState<ArrearsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const currentYear = new Date().getFullYear();
    const [startMonth, setStartMonth] = useState(`${currentYear}-01`);
    const [endMonth, setEndMonth] = useState(`${currentYear}-12`);
    const [template, setTemplate] = useState<TemplateKey>('reminder');
    const [message, setMessage] = useState(MESSAGE_TEMPLATES.reminder);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setData(await api<ArrearsResponse>(`/api/admin/arrears?from=${startMonth}&to=${endMonth}`, { auth: true }));
        } catch (err) {
            alert(errorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [startMonth, endMonth]);

    useEffect(() => {
        if (!getToken()) {
            router.push('/login');
            return;
        }
        fetchData();
        // sengaja hanya saat halaman dibuka; filter diterapkan lewat tombol "Tampilkan"
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const handleTemplateChange = (key: TemplateKey) => {
        setTemplate(key);
        setMessage(MESSAGE_TEMPLATES[key]);
    };

    const unpaid = data?.data.filter((r) => r.unpaidMonths > 0) ?? [];

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text('Laporan Tunggakan Iuran', 14, 15);
            doc.setFontSize(11);
            doc.text(`Periode: ${formatPeriod(startMonth, true)} s/d ${formatPeriod(endMonth, true)}`, 14, 22);
            doc.text(`${data?.housesWithUnpaid ?? 0} rumah menunggak, total ${formatRupiah(data?.totalUnpaidAmount ?? 0)}`, 14, 28);

            autoTable(doc, {
                startY: 35,
                head: [['No', 'Rumah', 'Nama', 'Bulan Tertunggak', 'Jumlah', 'Nominal']],
                body: unpaid.map((r, idx) => [
                    idx + 1,
                    `${r.block}/${r.houseNumber}${r.houseStatus === 'VACANT' ? ' (kosong)' : ''}`,
                    r.fullName ?? '-',
                    r.unpaidPeriods.map((p) => formatPeriod(p)).join(', '),
                    r.unpaidMonths,
                    formatRupiah(r.unpaidAmount),
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246] },
            });

            doc.save(`Laporan_Tunggakan_${startMonth}_${endMonth}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Gagal membuat PDF');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <MdArrowBack />
                        Kembali
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Tunggakan Iuran</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Bulan berjalan belum dihitung. Laporan yang masih menunggu approval tidak dihitung tunggakan.
                    </p>
                </div>

                {/* Filter */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md mb-4 flex flex-wrap gap-3 items-end">
                    <label className="flex-1 min-w-[140px] text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dari bulan
                        <input
                            type="month"
                            value={startMonth}
                            onChange={(e) => setStartMonth(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </label>
                    <label className="flex-1 min-w-[140px] text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sampai bulan
                        <input
                            type="month"
                            value={endMonth}
                            onChange={(e) => setEndMonth(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </label>
                    <button onClick={fetchData} className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium">
                        Tampilkan
                    </button>
                </div>

                {/* Ringkasan */}
                {data && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Rumah menunggak</p>
                            <p className="text-2xl font-bold text-red-600">
                                {data.housesWithUnpaid}
                                <span className="text-sm font-normal text-gray-500"> / {data.totalHouses}</span>
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total tunggakan</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(data.totalUnpaidAmount)}</p>
                        </div>
                    </div>
                )}

                {/* Template pesan */}
                <details className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md mb-4">
                    <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">Template pesan WhatsApp</summary>
                    <div className="flex gap-2 my-3">
                        {(Object.keys(MESSAGE_TEMPLATES) as TemplateKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => handleTemplateChange(key)}
                                className={`px-3 py-1.5 rounded-lg text-sm ${template === key ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                            >
                                {{ reminder: 'Pengingat', gentle: 'Halus', urgent: 'Tegas' }[key]}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={8}
                        className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Placeholder: [NAMA] [RUMAH] [BULAN] [DAFTAR_BULAN] [NOMINAL]
                    </p>
                </details>

                <div className="flex justify-end mb-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting || unpaid.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm"
                    >
                        <MdFileDownload /> {isExporting ? 'Membuat PDF...' : 'Export PDF'}
                    </button>
                </div>

                {/* Daftar */}
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Memuat...</div>
                ) : unpaid.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl">Tidak ada tunggakan di periode ini 🎉</div>
                ) : (
                    <ul className="space-y-3">
                        {unpaid.map((r) => (
                            <li key={r.houseId} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {r.block}/{r.houseNumber}
                                            {r.houseStatus === 'VACANT' && (
                                                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    kosong
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{r.fullName ?? '-'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-red-600">{formatRupiah(r.unpaidAmount)}</p>
                                        <p className="text-xs text-gray-500">{r.unpaidMonths} bulan</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                    {r.unpaidPeriods.map((p) => formatPeriod(p)).join(', ')}
                                </p>
                                {r.pendingMonths > 0 && (
                                    <p className="text-xs text-amber-600 mt-1">{r.pendingMonths} bulan lain menunggu approval</p>
                                )}
                                <div className="mt-3 flex justify-end">
                                    {r.phoneNumber ? (
                                        <a
                                            href={`https://wa.me/${toWaNumber(r.phoneNumber)}?text=${encodeURIComponent(personalize(message, r))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                                        >
                                            <MdWhatsapp className="text-lg" /> Kirim WA
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-400">Nomor HP belum terdaftar</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
