import { MONTHS_SHORT } from '@/lib/api';

// Kunci pilihan: 1 rumah × 1 bulan
export const itemKey = (houseId: number, period: string) => `${houseId}:${period}`;

export function parseKey(key: string) {
    const [houseId, period] = key.split(':');
    return { houseId: Number(houseId), period };
}

const toIndex = (period: string) => {
    const [y, m] = period.split('-').map(Number);
    return y * 12 + (m - 1);
};

const fromIndex = (i: number) => ({ year: Math.floor(i / 12), month: i % 12 });

// ['2026-08','2026-09','2026-10','2027-02'] → 'Agu – Okt 2026, Feb 2027'
export function summarizePeriods(periods: string[]) {
    const sorted = [...new Set(periods)].map(toIndex).sort((a, b) => a - b);
    const ranges: [number, number][] = [];
    for (const i of sorted) {
        const last = ranges[ranges.length - 1];
        if (last && i === last[1] + 1) last[1] = i;
        else ranges.push([i, i]);
    }
    return ranges
        .map(([a, b]) => {
            const s = fromIndex(a);
            const e = fromIndex(b);
            if (a === b) return `${MONTHS_SHORT[s.month]} ${s.year}`;
            if (s.year === e.year) return `${MONTHS_SHORT[s.month]} – ${MONTHS_SHORT[e.month]} ${e.year}`;
            return `${MONTHS_SHORT[s.month]} ${s.year} – ${MONTHS_SHORT[e.month]} ${e.year}`;
        })
        .join(', ');
}
