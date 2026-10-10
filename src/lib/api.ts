// Satu-satunya pintu ke backend v2: base URL, token, error seragam, redirect saat sesi habis.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface User {
    id: number;
    name: string;
    role: string;
}

export class ApiError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
        public details?: Record<string, unknown>,
    ) {
        super(message);
    }
}

// --- sesi login ("Ingat saya" → localStorage, selain itu sessionStorage) ---

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    try {
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
}

export function saveSession(token: string, user: User, remember: boolean) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('authChange'));
}

export function clearSession() {
    for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem('token');
        storage.removeItem('user');
    }
    window.dispatchEvent(new Event('authChange'));
}

// --- request ---

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    auth?: boolean; // kirim token; 401 → sesi dihapus & ke halaman login
}

export async function api<T>(path: string, { method = 'GET', body, auth = false }: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {};
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    let res: Response;
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
        });
    } catch {
        throw new ApiError(0, 'NETWORK_ERROR', 'Tidak bisa terhubung ke server. Periksa koneksi internet.');
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        if (auth && res.status === 401) {
            clearSession();
            if (typeof window !== 'undefined') window.location.href = '/login';
        }
        throw new ApiError(res.status, data?.code ?? 'ERROR', data?.message ?? 'Terjadi kesalahan', data?.details);
    }
    return data as T;
}

export const errorMessage = (err: unknown) =>
    err instanceof ApiError ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';

// --- format ---

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const formatRupiah = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;

// '2026-08' → 'Agu 2026' / 'Agustus 2026'
export function formatPeriod(period: string, long = false) {
    const [y, m] = period.split('-').map(Number);
    return `${(long ? MONTHS_LONG : MONTHS_SHORT)[m - 1]} ${y}`;
}

export { MONTHS_SHORT, MONTHS_LONG };

// --- tipe response backend ---

export interface PublicHouse {
    id: number;
    label: string;
    block: string;
    number: string;
    residentName: string | null;
    status: 'OCCUPIED' | 'VACANT' | null;
}

export type PeriodStatus = 'REPORTED' | 'ARREARS' | 'OPEN' | 'NOT_BILLED';

export interface HousePeriods {
    houseId: number;
    label: string;
    months: { period: string; status: PeriodStatus; feePlanCode: string | null; fee: number | null }[];
}

export interface PaymentItem {
    id: number;
    houseId: number;
    label: string;
    kind: 'MONTHLY_FEE' | 'THR';
    period: string;
    amount: number;
    voided: boolean;
}

export interface AdminPayment {
    id: number;
    payerName: string;
    paidAt: string;
    reportedAmount: number;
    expectedTotal: number;
    ocrAmount: number | null;
    ocrError: string | null;
    amountMatches: boolean;
    ocrMatches: boolean | null;
    proofUrl: string | null;
    status: 'PENDING' | 'WAITING_APPROVAL' | 'WAITING_MANUAL_INPUT' | 'APPROVED' | 'REJECTED';
    notes: string | null;
    rejectReason: string | null;
    createdAt: string;
    items: PaymentItem[];
}

export async function uploadProof(file: File): Promise<string> {
    const form = new FormData();
    form.append('image', file);
    const { proofUrl } = await api<{ proofUrl: string }>('/api/public/upload-proof', { method: 'POST', body: form });
    return proofUrl;
}
