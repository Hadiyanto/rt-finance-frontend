'use client';

import { MdCheck, MdCheckCircle } from 'react-icons/md';
import { MONTHS_SHORT, type PeriodStatus } from '@/lib/api';

export interface MonthCell {
    period: string;
    status: PeriodStatus;
    selected: boolean;
    conflict: boolean;
}

interface Props {
    months: MonthCell[];
    onToggle: (period: string) => void;
}

// Grid 4×3 bulan. Bulan yang sudah dilaporkan / tidak ditagih tidak bisa dipilih;
// bulan lalu yang belum dilaporkan diberi penanda "Belum" (tunggakan).
export default function MonthGrid({ months, onToggle }: Props) {
    return (
        <div className="grid grid-cols-4 gap-2">
            {months.map((m) => {
                const label = MONTHS_SHORT[Number(m.period.slice(5)) - 1];
                const disabled = m.status === 'REPORTED' || m.status === 'NOT_BILLED';
                const ring = m.conflict ? 'ring-2 ring-red-500' : '';

                if (disabled) {
                    return (
                        <button
                            key={m.period}
                            type="button"
                            disabled
                            className={`flex flex-col items-center justify-center min-h-14 py-2 px-1 rounded-xl bg-gray-100 dark:bg-gray-800 cursor-not-allowed ${ring}`}
                        >
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</span>
                            <span className="flex items-center gap-0.5 mt-0.5 text-[11px] leading-tight text-gray-500 dark:text-gray-400">
                                {m.status === 'REPORTED' ? (
                                    <>
                                        <MdCheckCircle className="text-green-600 text-xs" /> Dilaporkan
                                    </>
                                ) : (
                                    'Tidak ditagih'
                                )}
                            </span>
                        </button>
                    );
                }

                if (m.selected) {
                    return (
                        <button
                            key={m.period}
                            type="button"
                            aria-pressed="true"
                            onClick={() => onToggle(m.period)}
                            className={`flex flex-col items-center justify-center min-h-14 py-2 px-1 rounded-xl bg-primary text-white shadow-sm active:scale-95 transition-transform ${ring}`}
                        >
                            <span className="text-base font-bold">{label}</span>
                            <span className="flex items-center gap-0.5 mt-0.5 text-[11px] leading-tight font-medium">
                                <MdCheck className="text-xs" /> Dipilih
                            </span>
                        </button>
                    );
                }

                const arrears = m.status === 'ARREARS';
                return (
                    <button
                        key={m.period}
                        type="button"
                        aria-pressed="false"
                        onClick={() => onToggle(m.period)}
                        className={`flex flex-col items-center justify-center min-h-14 py-2 px-1 rounded-xl bg-white dark:bg-gray-900 border active:scale-95 transition-transform ${
                            arrears ? 'border-orange-400 dark:border-orange-500' : 'border-gray-200 dark:border-gray-700'
                        } ${ring}`}
                    >
                        <span className="text-base font-semibold text-[#111418] dark:text-white">{label}</span>
                        {arrears && (
                            <span className="flex items-center gap-1 mt-0.5 text-[11px] leading-tight font-medium text-orange-600 dark:text-orange-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Belum
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
