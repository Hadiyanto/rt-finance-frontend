'use client';

import { MdCheck, MdClose, MdWarning } from 'react-icons/md';
import { formatRupiah } from '@/lib/api';
import { summarizePeriods } from './periods';

export interface QuoteItem {
    houseId: number;
    label: string;
    period: string;
    feePlanCode: string;
    amount: number;
}

interface Props {
    payerName: string;
    items: QuoteItem[];
    expectedTotal: number | null;
    transferred: number;
    previewUrl: string | null;
    isSubmitting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

// Bottom sheet "Konfirmasi Laporan": rincian per rumah × bulan sebelum dikirim.
export default function ConfirmSheet({ payerName, items, expectedTotal, transferred, previewUrl, isSubmitting, onCancel, onConfirm }: Props) {
    const byHouse = new Map<string, QuoteItem[]>();
    for (const item of items) byHouse.set(item.label, [...(byHouse.get(item.label) ?? []), item]);
    const houseCount = byHouse.size;
    const monthCount = new Set(items.map((i) => i.period)).size;
    const differs = expectedTotal !== null && expectedTotal !== transferred;

    return (
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50" onClick={() => !isSubmitting && onCancel()} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[#111418] dark:text-white">Konfirmasi Laporan</h3>
                    <button onClick={onCancel} disabled={isSubmitting} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Tutup">
                        <MdClose className="text-2xl text-gray-500" />
                    </button>
                </div>

                <dl className="divide-y divide-gray-100 dark:divide-gray-800 mb-4">
                    <div className="flex justify-between py-3">
                        <dt className="text-gray-500 dark:text-gray-400">Nama Pelapor</dt>
                        <dd className="font-semibold text-[#111418] dark:text-white text-right">{payerName}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                        <dt className="text-gray-500 dark:text-gray-400">Jumlah</dt>
                        <dd className="font-semibold text-[#111418] dark:text-white">
                            {monthCount} bulan × {houseCount} rumah
                        </dd>
                    </div>
                </dl>

                <ul className="space-y-2 mb-4">
                    {[...byHouse.entries()].map(([label, houseItems]) => (
                        <li key={label} className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                            <div className="flex justify-between font-semibold text-[#111418] dark:text-white">
                                <span>{label}</span>
                                <span>{formatRupiah(houseItems.reduce((s, i) => s + i.amount, 0))}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{summarizePeriods(houseItems.map((i) => i.period))}</p>
                        </li>
                    ))}
                </ul>

                <dl className="divide-y divide-gray-100 dark:divide-gray-800 mb-4">
                    <div className="flex justify-between py-3">
                        <dt className="text-gray-500 dark:text-gray-400">Perkiraan iuran</dt>
                        <dd className="font-semibold text-[#111418] dark:text-white">{expectedTotal !== null ? formatRupiah(expectedTotal) : '-'}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                        <dt className="text-gray-500 dark:text-gray-400">Jumlah Ditransfer</dt>
                        <dd className="font-bold text-lg text-primary">{formatRupiah(transferred)}</dd>
                    </div>
                </dl>

                {differs && (
                    <p className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-300">
                        <MdWarning className="text-lg shrink-0 mt-0.5" />
                        Jumlah ditransfer berbeda {formatRupiah(Math.abs(transferred - (expectedTotal ?? 0)))} dari perkiraan. Laporan tetap bisa dikirim dan
                        akan dicek bendahara.
                    </p>
                )}

                {previewUrl && (
                    <div className="flex items-center gap-3 mb-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Bukti transfer" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Bukti transfer</span>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 py-4 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-4 rounded-xl font-semibold bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            <>
                                <MdCheck className="text-xl" />
                                Kirim
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
