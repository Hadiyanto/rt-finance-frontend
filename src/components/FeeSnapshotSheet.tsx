'use client';

import { useEffect, useState } from 'react';
import { MdChevronLeft, MdChevronRight, MdClose, MdInfo, MdWarning } from 'react-icons/md';
import { api, errorMessage, formatPeriod, formatRupiah } from '@/lib/api';

interface SnapshotItem {
    categoryId: number;
    code: string;
    name: string;
    collected: number;
    recorded: number;
    toAdd: number;
}

interface SnapshotPreview {
    period: string;
    label: string;
    alreadySnapshotted: boolean;
    items: SnapshotItem[];
    collectedTotal: number;
    recordedTotal: number;
    toAddTotal: number;
    legacyEntries: { id: number; entryDate: string; amount: number; description: string }[];
    created?: number[];
    voided?: number[];
}

interface Props {
    onClose: () => void;
    onDone: () => void;
}

const toPeriod = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
const now = new Date();
const CURRENT_INDEX = now.getFullYear() * 12 + now.getMonth();

// Ambil iuran bulan terpilih (laporan yang sudah disetujui) lalu catat sebagai pemasukan kas per pos rekap.
export default function FeeSnapshotSheet({ onClose, onDone }: Props) {
    const [monthIndex, setMonthIndex] = useState(CURRENT_INDEX - 1); // default bulan lalu
    const period = toPeriod(monthIndex);
    const [preview, setPreview] = useState<{ period: string; data: SnapshotPreview } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        api<SnapshotPreview>(`/api/admin/ledger/fee-snapshot?period=${period}`, { auth: true })
            .then((data) => !cancelled && setPreview({ period, data }))
            .catch((err) => !cancelled && setError(errorMessage(err)));
        return () => {
            cancelled = true;
        };
    }, [period]);

    const data = preview?.period === period ? preview.data : null;
    const hasWork = !!data && (data.toAddTotal > 0 || data.legacyEntries.length > 0);

    const changeMonth = (delta: number) => {
        setError(null);
        setResult(null);
        setMonthIndex((i) => Math.min(i + delta, CURRENT_INDEX));
    };

    const save = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const saved = await api<SnapshotPreview>('/api/admin/ledger/fee-snapshot', { method: 'POST', auth: true, body: { period } });
            setPreview({ period, data: saved });
            setResult(
                `${saved.created?.length ?? 0} pemasukan dicatat` +
                    (saved.voided?.length ? `, ${saved.voided.length} entri lama diganti` : '') +
                    '.'
            );
            onDone();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50" onClick={() => !isSaving && onClose()} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto animate-slide-up">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold">Catat iuran ke kas</h3>
                    <button onClick={onClose} disabled={isSaving} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tutup">
                        <MdClose className="text-2xl text-slate-500" />
                    </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Iuran yang sudah disetujui dicatat sebagai pemasukan, dipisah per pos seperti rekap di Laporan Iuran.
                </p>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-1 py-1 mb-4">
                    <button onClick={() => changeMonth(-1)} disabled={isSaving} className="w-11 h-11 flex items-center justify-center rounded-full" aria-label="Bulan sebelumnya">
                        <MdChevronLeft className="text-2xl" />
                    </button>
                    <span className="font-bold">{formatPeriod(period, true)}</span>
                    <button
                        onClick={() => changeMonth(1)}
                        disabled={isSaving || monthIndex >= CURRENT_INDEX}
                        className="w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-30"
                        aria-label="Bulan berikutnya"
                    >
                        <MdChevronRight className="text-2xl" />
                    </button>
                </div>

                {!data ? (
                    error ? (
                        <p className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">{error}</p>
                    ) : (
                        <div className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    )
                ) : (
                    <>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-3">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                                <span>Pos</span>
                                <span className="text-right">Di kas</span>
                                <span className="text-right">Ditambah</span>
                            </div>
                            {data.items.map((item) => (
                                <div key={item.code} className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2.5 border-t border-slate-100 dark:border-slate-800 text-sm items-center">
                                    <span>
                                        <span className="font-medium block leading-snug">{item.name.replace(/^Iuran: /, '')}</span>
                                        <span className="text-xs text-slate-500">Terkumpul {formatRupiah(item.collected)}</span>
                                    </span>
                                    <span className="text-right text-slate-500">{formatRupiah(item.recorded)}</span>
                                    <span className={`text-right font-semibold ${item.toAdd > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {item.toAdd > 0 ? `+${formatRupiah(item.toAdd)}` : '-'}
                                    </span>
                                </div>
                            ))}
                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2.5 border-t-2 border-slate-200 dark:border-slate-700 text-sm font-bold">
                                <span>Total {formatRupiah(data.collectedTotal)}</span>
                                <span className="text-right">{formatRupiah(data.recordedTotal)}</span>
                                <span className="text-right text-emerald-600 dark:text-emerald-400">+{formatRupiah(data.toAddTotal)}</span>
                            </div>
                        </div>

                        {data.legacyEntries.length > 0 && (
                            <p className="flex items-start gap-2 p-3 mb-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-300">
                                <MdWarning className="text-lg shrink-0 mt-0.5" />
                                <span>
                                    Entri kas lama {data.legacyEntries.map((e) => `"${e.description}" (${formatRupiah(e.amount)})`).join(', ')} akan diganti
                                    oleh pencatatan ini. Entri lama tetap tersimpan sebagai VOID.
                                </span>
                            </p>
                        )}

                        {data.alreadySnapshotted && data.toAddTotal > 0 && (
                            <p className="flex items-start gap-2 p-3 mb-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-300">
                                <MdInfo className="text-lg shrink-0 mt-0.5" />
                                Bulan ini sudah pernah dicatat. Yang ditambahkan hanya iuran yang disetujui setelahnya (susulan).
                            </p>
                        )}

                        {!hasWork && !result && (
                            <p className="p-3 mb-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300">
                                {data.collectedTotal === 0 ? 'Belum ada iuran yang disetujui untuk bulan ini.' : 'Semua iuran bulan ini sudah tercatat di kas.'}
                            </p>
                        )}

                        {result && <p className="p-3 mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-sm text-emerald-800 dark:text-emerald-300">{result}</p>}
                        {error && <p className="p-3 mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">{error}</p>}

                        <button
                            onClick={save}
                            disabled={!hasWork || isSaving}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold"
                        >
                            {isSaving ? 'Mencatat...' : hasWork ? `Catat ${formatRupiah(data.toAddTotal)} ke kas` : 'Tidak ada yang perlu dicatat'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
