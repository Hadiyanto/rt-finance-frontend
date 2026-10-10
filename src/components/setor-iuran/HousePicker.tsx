'use client';

import { useMemo, useState } from 'react';
import { MdCheckBox, MdCheckBoxOutlineBlank, MdClose, MdSearch } from 'react-icons/md';
import type { PublicHouse } from '@/lib/api';

interface Props {
    houses: PublicHouse[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    onClose: () => void;
}

// Bottom sheet: cari & centang rumah (bisa lebih dari satu).
export default function HousePicker({ houses, selectedIds, onChange, onClose }: Props) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return houses;
        return houses.filter((h) => h.label.toLowerCase().includes(q) || (h.residentName ?? '').toLowerCase().includes(q));
    }, [houses, query]);

    const toggle = (id: number) => {
        onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
    };

    return (
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl p-4 pb-6 flex flex-col max-h-[85vh] animate-slide-up">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-[#111418] dark:text-white">Pilih rumah</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Tutup">
                        <MdClose className="text-2xl text-gray-500" />
                    </button>
                </div>

                <label className="flex items-center gap-2 h-12 px-3 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary">
                    <MdSearch className="text-xl text-gray-400" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari blok atau nama"
                        className="flex-1 bg-transparent outline-none text-base text-[#111418] dark:text-white"
                    />
                </label>

                <ul className="overflow-y-auto -mx-1 flex-1">
                    {filtered.map((h) => {
                        const checked = selectedIds.includes(h.id);
                        return (
                            <li key={h.id}>
                                <button
                                    type="button"
                                    onClick={() => toggle(h.id)}
                                    className="w-full flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                                >
                                    {checked ? (
                                        <MdCheckBox className="text-2xl text-primary shrink-0" />
                                    ) : (
                                        <MdCheckBoxOutlineBlank className="text-2xl text-gray-400 shrink-0" />
                                    )}
                                    <span className="font-semibold text-[#111418] dark:text-white w-14 shrink-0">{h.label}</span>
                                    <span className="text-gray-600 dark:text-gray-300 truncate">{h.residentName ?? '-'}</span>
                                </button>
                            </li>
                        );
                    })}
                    {filtered.length === 0 && <li className="p-4 text-center text-gray-500">Rumah tidak ditemukan</li>}
                </ul>

                <button onClick={onClose} className="mt-3 w-full h-12 rounded-xl bg-primary text-white font-semibold">
                    Selesai ({selectedIds.length} rumah)
                </button>
            </div>
        </div>
    );
}
