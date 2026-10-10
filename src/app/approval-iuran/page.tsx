'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { MdArrowBack, MdCheckCircle, MdCancel, MdImage, MdClose, MdWarning } from 'react-icons/md';
import { api, errorMessage, formatPeriod, formatRupiah, getToken, type AdminPayment } from '@/lib/api';

interface ListResponse {
    total: number;
    summary: Record<string, number>;
    data: AdminPayment[];
}

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
    PENDING: { text: 'Menunggu OCR', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
    WAITING_APPROVAL: { text: 'Siap dicek', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    WAITING_MANUAL_INPUT: { text: 'Cek manual', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

// "C/12: Agu, Sep 2026" — item dikelompokkan per rumah
function groupItems(p: AdminPayment) {
    const byHouse = new Map<string, string[]>();
    for (const item of p.items.filter((i) => !i.voided)) {
        const key = item.kind === 'THR' ? `${item.label} · THR` : item.label;
        const text = item.kind === 'THR' ? item.period : formatPeriod(item.period);
        byHouse.set(key, [...(byHouse.get(key) ?? []), text]);
    }
    return [...byHouse.entries()];
}

export default function ApprovalIuranPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [payments, setPayments] = useState<AdminPayment[]>([]);

    const [approving, setApproving] = useState<AdminPayment | null>(null);
    const [correctedAmount, setCorrectedAmount] = useState('');
    const [rejecting, setRejecting] = useState<AdminPayment | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api<ListResponse>('/api/admin/payments', { auth: true });
            setPayments(data.data);
        } catch (err) {
            alert(errorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!getToken()) {
            router.push('/login');
            return;
        }
        setIsLoggedIn(true);
        fetchData();
    }, [router, fetchData]);

    const openApprove = (p: AdminPayment) => {
        setApproving(p);
        setCorrectedAmount(String(p.reportedAmount));
    };

    const confirmApprove = async () => {
        if (!approving) return;
        const amount = parseInt(correctedAmount.replace(/\D/g, ''), 10);
        if (!amount) {
            alert('Nominal transfer wajib diisi');
            return;
        }
        try {
            setIsSubmitting(true);
            await api(`/api/admin/payments/${approving.id}/approve`, {
                method: 'POST',
                auth: true,
                body: amount !== approving.reportedAmount ? { reportedAmount: amount } : {},
            });
            setApproving(null);
            fetchData();
        } catch (err) {
            alert(`Gagal menyetujui: ${errorMessage(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmReject = async () => {
        if (!rejecting) return;
        if (rejectReason.trim().length < 3) {
            alert('Alasan penolakan wajib diisi');
            return;
        }
        try {
            setIsSubmitting(true);
            await api(`/api/admin/payments/${rejecting.id}/reject`, {
                method: 'POST',
                auth: true,
                body: { reason: rejectReason.trim() },
            });
            setRejecting(null);
            setRejectReason('');
            fetchData();
        } catch (err) {
            alert(`Gagal menolak: ${errorMessage(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoggedIn) {
        return null;
    }

    const readyCount = payments.filter((p) => p.status !== 'PENDING').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-28">
            {/* Header */}
            <header className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Kembali">
                        <MdArrowBack className="text-2xl" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">Approval Iuran</h1>
                        <p className="text-sm text-blue-100">Cek laporan warga lalu setujui atau tolak</p>
                    </div>
                </div>
            </header>

            {/* Summary */}
            <div className="p-4 grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Siap dicek</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{readyCount}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Menunggu OCR</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{payments.length - readyCount}</p>
                </div>
            </div>

            <main className="px-4 space-y-3">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Memuat...</div>
                ) : payments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl">Tidak ada laporan yang perlu dicek</div>
                ) : (
                    payments.map((p) => {
                        const status = STATUS_LABEL[p.status] ?? STATUS_LABEL.PENDING;
                        return (
                            <article key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{p.payerName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Dilaporkan {new Date(p.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${status.className}`}>{status.text}</span>
                                </div>

                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                    {groupItems(p).map(([house, periods]) => (
                                        <li key={house}>
                                            <span className="font-semibold">{house}</span>: {periods.join(', ')}
                                        </li>
                                    ))}
                                </ul>

                                <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2">
                                        <dt className="text-gray-500 dark:text-gray-400">Ditransfer</dt>
                                        <dd className="font-bold text-gray-900 dark:text-white">{formatRupiah(p.reportedAmount)}</dd>
                                    </div>
                                    <div className={`rounded-lg p-2 ${p.amountMatches ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                                        <dt className="text-gray-500 dark:text-gray-400">Seharusnya</dt>
                                        <dd className="font-bold text-gray-900 dark:text-white">{formatRupiah(p.expectedTotal)}</dd>
                                    </div>
                                    <div className={`rounded-lg p-2 ${p.ocrMatches === false ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                        <dt className="text-gray-500 dark:text-gray-400">Terbaca OCR</dt>
                                        <dd className="font-bold text-gray-900 dark:text-white">{p.ocrAmount != null ? formatRupiah(p.ocrAmount) : '-'}</dd>
                                    </div>
                                </dl>

                                {(!p.amountMatches || p.ocrMatches === false || p.ocrError) && (
                                    <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                                        <MdWarning className="text-base shrink-0" />
                                        {!p.amountMatches
                                            ? `Selisih ${formatRupiah(Math.abs(p.reportedAmount - p.expectedTotal))} dari nominal seharusnya.`
                                            : p.ocrError
                                              ? 'Bukti tidak bisa dibaca otomatis, cek manual.'
                                              : 'Nominal di bukti berbeda dengan yang dilaporkan.'}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    {p.proofUrl && (
                                        <button
                                            onClick={() => setImageUrl(p.proofUrl)}
                                            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                        >
                                            <MdImage className="text-lg" /> Bukti
                                        </button>
                                    )}
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => setRejecting(p)}
                                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg"
                                    >
                                        <MdCancel className="text-base" /> Tolak
                                    </button>
                                    <button
                                        onClick={() => openApprove(p)}
                                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg"
                                    >
                                        <MdCheckCircle className="text-base" /> Setujui
                                    </button>
                                </div>
                            </article>
                        );
                    })
                )}
            </main>

            {/* Modal setujui */}
            {approving && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !isSubmitting && setApproving(null)} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Setujui laporan</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {describePayment(approving)} · seharusnya {formatRupiah(approving.expectedTotal)}
                        </p>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Nominal yang benar-benar ditransfer (Rp)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={correctedAmount}
                            onChange={(e) => setCorrectedAmount(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1 mb-6">Ubah hanya kalau warga salah mengisi nominal.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setApproving(null)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmApprove}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl disabled:opacity-50"
                            >
                                {isSubmitting ? 'Memproses...' : 'Setujui'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal tolak */}
            {rejecting && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !isSubmitting && setRejecting(null)} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tolak laporan</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {describePayment(rejecting)}. Bulan-bulannya bisa dilaporkan ulang oleh warga.
                        </p>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Alasan</label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            placeholder="Mis. bukti transfer tidak sesuai"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-6"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejecting(null)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50"
                            >
                                {isSubmitting ? 'Memproses...' : 'Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal bukti */}
            {imageUrl && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/90" onClick={() => setImageUrl(null)} />
                    <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <button
                            onClick={() => setImageUrl(null)}
                            className="pointer-events-auto absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full z-10"
                            aria-label="Tutup"
                        >
                            <MdClose className="text-white text-2xl" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Bukti transfer" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

function describePayment(p: AdminPayment) {
    const active = p.items.filter((i) => !i.voided);
    const houses = new Set(active.map((i) => i.label)).size;
    return `${p.payerName} · ${houses} rumah · ${active.length} item`;
}
