'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import MonthGrid, { type MonthCell } from '@/components/setor-iuran/MonthGrid';
import HousePicker from '@/components/setor-iuran/HousePicker';
import ConfirmSheet, { type QuoteItem } from '@/components/setor-iuran/ConfirmSheet';
import { itemKey, parseKey, summarizePeriods } from '@/components/setor-iuran/periods';
import {
    MdAdd,
    MdCalendarToday,
    MdCheckCircle,
    MdChevronLeft,
    MdChevronRight,
    MdClose,
    MdDelete,
    MdEdit,
    MdError,
    MdInfo,
    MdPerson,
    MdPhotoCamera,
    MdSend,
    MdVerified,
    MdWarning,
} from 'react-icons/md';
import {
    api,
    ApiError,
    errorMessage,
    formatPeriod,
    formatRupiah,
    getToken,
    uploadProof,
    type HousePeriods,
    type PublicHouse,
} from '@/lib/api';

interface Quote {
    items: QuoteItem[];
    expectedTotal: number;
    conflicts: { houseId: number; label: string; period: string }[];
}

type Errors = Partial<Record<'houses' | 'months' | 'name' | 'amount' | 'proof', string>>;

const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1];
const isSelectable = (status: string) => status === 'ARREARS' || status === 'OPEN';

export default function SetorIuranPage() {
    const router = useRouter();
    const [houses, setHouses] = useState<PublicHouse[]>([]);
    const [houseIds, setHouseIds] = useState<number[]>([]);
    const [payerName, setPayerName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameEdited, setNameEdited] = useState(false);

    const [year, setYear] = useState(THIS_YEAR);
    const [periodsData, setPeriodsData] = useState<{ key: string; houses: HousePeriods[] } | null>(null);
    const [refreshCount, setRefreshCount] = useState(0);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [conflicts, setConflicts] = useState<Set<string>>(new Set());
    const [quote, setQuote] = useState<{ key: string; data: Quote } | null>(null);

    const [amount, setAmount] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [errors, setErrors] = useState<Errors>({});
    const [showPicker, setShowPicker] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // --- data ---

    useEffect(() => {
        api<{ data: PublicHouse[] }>('/api/public/houses')
            .then(({ data }) => setHouses(data))
            .catch((err) => setToast({ type: 'error', message: errorMessage(err) }));
    }, []);

    const periodsKey = `${year}|${houseIds.join(',')}|${refreshCount}`;
    useEffect(() => {
        if (houseIds.length === 0) return;
        let cancelled = false;
        api<{ houses: HousePeriods[] }>(`/api/public/house-periods?houseIds=${houseIds.join(',')}&year=${year}`)
            .then(({ houses: data }) => !cancelled && setPeriodsData({ key: periodsKey, houses: data }))
            .catch((err) => !cancelled && setToast({ type: 'error', message: errorMessage(err) }));
        return () => {
            cancelled = true;
        };
        // periodsKey sudah mencakup year, houseIds, refreshCount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodsKey]);
    const housePeriods = periodsData?.key === periodsKey ? periodsData.houses : null;

    // perkiraan nominal dari server, dihitung ulang setiap pilihan berubah
    const selectionKey = [...selected].sort().join(',');
    useEffect(() => {
        if (selected.size === 0) return;
        const timer = setTimeout(() => {
            api<Quote>('/api/public/payments/quote', { method: 'POST', body: { items: [...selected].map(parseKey) } })
                .then((data) => setQuote({ key: selectionKey, data }))
                .catch(() => undefined);
        }, 300);
        return () => clearTimeout(timer);
        // selectionKey mewakili isi `selected`
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectionKey]);
    const currentQuote = selected.size > 0 && quote?.key === selectionKey ? quote.data : null;

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    // --- rumah ---

    const housesById = useMemo(() => new Map(houses.map((h) => [h.id, h])), [houses]);

    const changeHouses = (ids: number[]) => {
        setHouseIds(ids);
        setErrors((e) => ({ ...e, houses: undefined }));
        // pilihan bulan untuk rumah yang dilepas ikut dihapus
        setSelected((prev) => new Set([...prev].filter((k) => ids.includes(parseKey(k).houseId))));
        if (!nameEdited) {
            setPayerName(ids.length > 0 ? housesById.get(ids[0])?.residentName ?? '' : '');
        }
    };

    // --- bulan (opsi A: 1 grid kalau status semua rumah sama, dipecah per rumah kalau berbeda) ---

    const merged = useMemo(() => {
        if (!housePeriods || housePeriods.length < 2) return true;
        const [first, ...rest] = housePeriods;
        return rest.every((h) => h.months.every((m, i) => m.status === first.months[i].status));
    }, [housePeriods]);

    const toggle = (houseIdsToToggle: number[], period: string) => {
        setErrors((e) => ({ ...e, months: undefined }));
        setConflicts(new Set());
        setSelected((prev) => {
            const next = new Set(prev);
            const keys = houseIdsToToggle.map((id) => itemKey(id, period));
            const allSelected = keys.every((k) => next.has(k));
            for (const k of keys) {
                if (allSelected) next.delete(k);
                else next.add(k);
            }
            return next;
        });
    };

    const mergedCells = (): MonthCell[] =>
        housePeriods![0].months.map((m) => {
            const keys = housePeriods!.map((h) => itemKey(h.houseId, m.period));
            return {
                period: m.period,
                status: m.status,
                selected: keys.every((k) => selected.has(k)),
                conflict: keys.some((k) => conflicts.has(k)),
            };
        });

    const houseCells = (h: HousePeriods): MonthCell[] =>
        h.months.map((m) => ({
            period: m.period,
            status: m.status,
            selected: selected.has(itemKey(h.houseId, m.period)),
            conflict: conflicts.has(itemKey(h.houseId, m.period)),
        }));

    // "Samakan pilihan": bulan yang dipilih di rumah pertama diterapkan ke rumah lain (yang bisa dipilih)
    const copyFirstHouseSelection = () => {
        if (!housePeriods || housePeriods.length < 2) return;
        const [first, ...rest] = housePeriods;
        const periods = first.months.filter((m) => selected.has(itemKey(first.houseId, m.period))).map((m) => m.period);
        setSelected((prev) => {
            const next = new Set(prev);
            for (const h of rest) {
                for (const m of h.months) {
                    const k = itemKey(h.houseId, m.period);
                    if (periods.includes(m.period) && isSelectable(m.status)) next.add(k);
                    else if (!periods.includes(m.period)) next.delete(k);
                }
            }
            return next;
        });
    };

    const selectedPeriods = [...selected].map((k) => parseKey(k).period);
    const selectedHouseCount = new Set([...selected].map((k) => parseKey(k).houseId)).size;

    // --- nominal & bukti ---

    const transferred = parseInt(amount.replace(/\D/g, '') || '0', 10);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '');
        setAmount(digits ? new Intl.NumberFormat('id-ID').format(parseInt(digits, 10)) : '');
        setErrors((er) => ({ ...er, amount: undefined }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith('image/')) {
            setErrors((er) => ({ ...er, proof: 'Hanya file gambar yang diperbolehkan' }));
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setErrors((er) => ({ ...er, proof: 'Ukuran file maksimal 5MB' }));
            return;
        }
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
        setErrors((er) => ({ ...er, proof: undefined }));
    };

    const removeFile = () => {
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- kirim ---

    const handleSubmitClick = async () => {
        const next: Errors = {};
        if (houseIds.length === 0) next.houses = 'Pilih minimal satu rumah';
        if (selected.size === 0) next.months = 'Pilih minimal satu bulan';
        if (payerName.trim().length < 2) next.name = 'Nama pelapor harus diisi';
        if (!transferred) next.amount = 'Jumlah transfer harus diisi';
        if (!file) next.proof = 'Foto bukti transfer harus diunggah';
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        // pastikan rincian & perkiraan terbaru sudah ada sebelum konfirmasi
        let data = currentQuote;
        if (!data) {
            try {
                data = await api<Quote>('/api/public/payments/quote', { method: 'POST', body: { items: [...selected].map(parseKey) } });
                setQuote({ key: selectionKey, data });
            } catch (err) {
                setToast({ type: 'error', message: errorMessage(err) });
                return;
            }
        }
        if (data.conflicts.length > 0) {
            showConflicts(data.conflicts);
            return;
        }
        setShowConfirm(true);
    };

    const showConflicts = (list: Quote['conflicts']) => {
        setConflicts(new Set(list.map((c) => itemKey(c.houseId, c.period))));
        setToast({
            type: 'error',
            message: `${list.map((c) => `${formatPeriod(c.period)} untuk ${c.label}`).join(', ')} sudah pernah dilaporkan.`,
        });
        setRefreshCount((c) => c + 1);
    };

    const handleConfirm = async () => {
        if (!file) return;
        setIsSubmitting(true);
        try {
            const proofUrl = await uploadProof(file);
            await api('/api/public/payments', {
                method: 'POST',
                body: {
                    payerName: payerName.trim(),
                    reportedAmount: transferred,
                    proofUrl,
                    items: [...selected].map(parseKey),
                },
            });
            setShowConfirm(false);
            setToast({ type: 'success', message: 'Laporan terkirim. Terima kasih!' });
            setSelected(new Set());
            setAmount('');
            removeFile();
            setRefreshCount((c) => c + 1);
        } catch (err) {
            setShowConfirm(false);
            if (err instanceof ApiError && err.code === 'PERIOD_ALREADY_REPORTED') {
                showConflicts((err.details?.conflicts ?? []) as Quote['conflicts']);
            } else {
                setToast({ type: 'error', message: errorMessage(err) });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const expected = currentQuote?.expectedTotal ?? null;
    const amountDiffers = expected !== null && transferred > 0 && transferred !== expected;

    return (
        <main className="min-h-screen w-full bg-background-light dark:bg-background-dark flex justify-center font-display">
            <div className="relative flex min-h-screen w-full max-w-[430px] mx-auto flex-col bg-background-light dark:bg-background-dark overflow-x-hidden pb-28">
                {/* Header */}
                <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-3 bg-white/90 dark:bg-background-dark/90 backdrop-blur border-b border-gray-100 dark:border-gray-800">
                    <div className="w-10" />
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-bold text-[#111418] dark:text-white leading-tight">Setor Iuran</h1>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> RT 001
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push(getToken() ? '/profile' : '/login')}
                        className="w-10 h-10 flex items-center justify-center"
                        aria-label="Halaman pengurus"
                    >
                        <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <MdPerson className="text-white text-lg" />
                        </span>
                    </button>
                </header>

                <div className="flex flex-col gap-5 p-4">
                    {/* Info */}
                    <div className="flex items-start gap-2 p-4 rounded-xl bg-blue-50 dark:bg-primary/10 border border-primary/20">
                        <MdInfo className="text-primary text-xl shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                            Pastikan rumah, bulan, dan nominal sesuai dengan bukti transfer sebelum menekan <strong>Kirim Laporan</strong>.
                        </p>
                    </div>

                    {/* Rumah */}
                    <section className="flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-[#111418] dark:text-white">Blok / Nomor Rumah</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pilih rumah yang dibayarkan. Bisa lebih dari satu.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {houseIds.map((id) => {
                                const h = housesById.get(id);
                                return (
                                    <span key={id} className="inline-flex items-center gap-1.5 h-10 pl-3 pr-1 rounded-full bg-primary/10 text-[#111418] dark:text-white text-sm font-medium">
                                        {h?.label} · {h?.residentName ?? '-'}
                                        <button
                                            type="button"
                                            onClick={() => changeHouses(houseIds.filter((x) => x !== id))}
                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600"
                                            aria-label={`Hapus rumah ${h?.label}`}
                                        >
                                            <MdClose />
                                        </button>
                                    </span>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setShowPicker(true)}
                                disabled={houses.length === 0}
                                className="inline-flex items-center gap-1 h-10 px-3.5 rounded-full border border-dashed border-primary text-primary text-sm font-semibold disabled:opacity-50"
                            >
                                <MdAdd className="text-lg" /> Tambah rumah
                            </button>
                        </div>
                        {errors.houses && <p className="text-red-500 text-sm">{errors.houses}</p>}

                        <div>
                            <label htmlFor="payer-name" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                                Nama Pelapor
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="payer-name"
                                    value={payerName}
                                    readOnly={!isEditingName}
                                    onChange={(e) => {
                                        setPayerName(e.target.value);
                                        setNameEdited(true);
                                        setErrors((er) => ({ ...er, name: undefined }));
                                    }}
                                    placeholder="Terisi otomatis dari rumah yang dipilih"
                                    className={`flex-1 h-12 px-4 rounded-xl border font-medium outline-none ${
                                        isEditingName
                                            ? 'border-primary bg-white dark:bg-gray-800 text-[#111418] dark:text-white focus:ring-2 focus:ring-primary'
                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-[#111418] dark:text-white'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsEditingName((v) => !v)}
                                    className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center"
                                    aria-label={isEditingName ? 'Selesai mengubah nama' : 'Ubah nama pelapor'}
                                >
                                    {isEditingName ? <MdCheckCircle className="text-xl text-green-600" /> : <MdEdit className="text-xl" />}
                                </button>
                            </div>
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>
                    </section>

                    {/* Bulan */}
                    <section className="flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-[#111418] dark:text-white">Pilih Bulan Iuran</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Ketuk bulan yang dibayar. Bisa pilih beberapa bulan, termasuk bulan sebelumnya atau bulan ke depan.
                            </p>
                        </div>

                        <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <button
                                type="button"
                                onClick={() => setYear((y) => y - 1)}
                                disabled={year <= YEARS[0]}
                                className="w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-30"
                                aria-label="Tahun sebelumnya"
                            >
                                <MdChevronLeft className="text-2xl" />
                            </button>
                            <span className="flex items-center gap-1.5 text-xl font-bold text-[#111418] dark:text-white">
                                <MdCalendarToday className="text-primary text-lg" /> {year}
                            </span>
                            <button
                                type="button"
                                onClick={() => setYear((y) => y + 1)}
                                disabled={year >= YEARS[YEARS.length - 1]}
                                className="w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-30"
                                aria-label="Tahun berikutnya"
                            >
                                <MdChevronRight className="text-2xl" />
                            </button>
                        </div>

                        {houseIds.length === 0 ? (
                            <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 rounded-xl bg-gray-50 dark:bg-gray-800">
                                Pilih rumah dulu untuk melihat bulan yang bisa dilaporkan.
                            </p>
                        ) : !housePeriods ? (
                            <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                        ) : merged ? (
                            <MonthGrid months={mergedCells()} onToggle={(p) => toggle(houseIds, p)} />
                        ) : (
                            <div className="flex flex-col gap-4">
                                <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <MdInfo className="text-primary text-lg shrink-0" />
                                    Riwayat iuran rumah-rumah ini berbeda, jadi bulan dipilih per rumah.
                                </p>
                                {housePeriods.map((h) => (
                                    <div key={h.houseId} className="flex flex-col gap-2">
                                        <h3 className="font-semibold text-[#111418] dark:text-white">
                                            {h.label} · {housesById.get(h.houseId)?.residentName ?? '-'}
                                        </h3>
                                        <MonthGrid months={houseCells(h)} onToggle={(p) => toggle([h.houseId], p)} />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={copyFirstHouseSelection}
                                    className="h-11 rounded-xl border border-primary text-primary text-sm font-semibold"
                                >
                                    Samakan pilihan {housePeriods[0].label} untuk semua rumah
                                </button>
                            </div>
                        )}

                        {selected.size > 0 && (
                            <p className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-sm font-semibold text-[#111418] dark:text-white">
                                <MdVerified className="text-primary text-lg shrink-0" />
                                {new Set(selectedPeriods).size} bulan dipilih{selectedHouseCount > 1 ? ` · ${selectedHouseCount} rumah` : ''}:{' '}
                                {summarizePeriods(selectedPeriods)}
                            </p>
                        )}
                        {errors.months && <p className="text-red-500 text-sm">{errors.months}</p>}
                    </section>

                    {/* Nominal */}
                    <section className="flex flex-col gap-2 p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-[#111418] dark:text-white">Jumlah yang Ditransfer (Rp)</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Isi sesuai nominal di bukti transfer.</p>
                        </div>
                        <div className="flex items-center h-14 px-4 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary">
                            <span className="text-xl font-bold text-gray-500 mr-2">Rp</span>
                            <input
                                aria-label="Jumlah yang ditransfer"
                                inputMode="numeric"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="w-full bg-transparent text-xl font-bold text-[#111418] dark:text-white outline-none"
                            />
                        </div>
                        {expected !== null && <p className="text-sm text-gray-600 dark:text-gray-300">Perkiraan: {formatRupiah(expected)}</p>}
                        {amountDiffers && (
                            <p className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-300">
                                <MdWarning className="text-lg shrink-0" />
                                Berbeda {formatRupiah(Math.abs(transferred - expected!))} dari perkiraan. Tetap bisa dikirim, nanti dicek bendahara.
                            </p>
                        )}
                        {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
                    </section>

                    {/* Bukti */}
                    <section className="flex flex-col gap-2 p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-[#111418] dark:text-white">Bukti Transfer</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Unggah foto struk transfer atau kwitansi.</p>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        {previewUrl ? (
                            <div className="relative w-full rounded-xl overflow-hidden border-2 border-primary/30">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt="Pratinjau bukti transfer" className="w-full max-h-[300px] object-contain bg-gray-100 dark:bg-gray-800" />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow"
                                        aria-label="Ganti foto"
                                    >
                                        <MdEdit className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow"
                                        aria-label="Hapus foto"
                                    >
                                        <MdDelete className="text-red-500" />
                                    </button>
                                </div>
                                <p className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white text-sm truncate">{file?.name}</p>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center gap-1 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                            >
                                <span className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                                    <MdPhotoCamera className="text-3xl" />
                                </span>
                                <span className="font-semibold text-primary">Ketuk untuk Ambil Foto</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Atau pilih dari galeri (JPG, PNG maks. 5MB)</span>
                            </button>
                        )}
                        {errors.proof && <p className="text-red-500 text-sm">{errors.proof}</p>}
                    </section>

                    <button
                        type="button"
                        onClick={handleSubmitClick}
                        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                    >
                        <MdSend className="text-xl" /> Kirim Laporan
                    </button>
                </div>

                <BottomNav />
            </div>

            {showPicker && <HousePicker houses={houses} selectedIds={houseIds} onChange={changeHouses} onClose={() => setShowPicker(false)} />}

            {showConfirm && (
                <ConfirmSheet
                    payerName={payerName.trim()}
                    items={currentQuote?.items ?? []}
                    expectedTotal={expected}
                    transferred={transferred}
                    previewUrl={previewUrl}
                    isSubmitting={isSubmitting}
                    onCancel={() => setShowConfirm(false)}
                    onConfirm={handleConfirm}
                />
            )}

            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-[400px] animate-slide-down" role="status">
                    <div className={`flex items-center gap-3 p-4 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {toast.type === 'success' ? <MdCheckCircle className="text-2xl shrink-0" /> : <MdError className="text-2xl shrink-0" />}
                        <p className="flex-1 font-medium">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="p-1 rounded-full hover:bg-white/20" aria-label="Tutup">
                            <MdClose className="text-xl" />
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
