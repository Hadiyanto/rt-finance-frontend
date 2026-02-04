'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { MdArrowBack, MdCheckCircle, MdCancel, MdImage, MdClose } from 'react-icons/md';

interface MonthlyFeeItem {
    id: number;
    block: string;
    houseNumber: string;
    fullName: string;
    date: string;
    amount: number | null;
    imageUrl: string | null;
    status: string; // WAITING_APPROVAL | WAITING_MANUAL_INPUT
    rawText: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse {
    total: number;
    summary: {
        waitingApproval: number;
        waitingManualInput: number;
    };
    data: MonthlyFeeItem[];
}

export default function ApprovalIuranPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fees, setFees] = useState<MonthlyFeeItem[]>([]);
    const [summary, setSummary] = useState({ waitingApproval: 0, waitingManualInput: 0 });

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState<MonthlyFeeItem | null>(null);
    const [inputAmount, setInputAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image modal states
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        setIsLoggedIn(true);
        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee/pending-approval`);
            if (response.ok) {
                const data: ApiResponse = await response.json();
                setFees(data.data);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Failed to fetch pending approvals:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = (fee: MonthlyFeeItem) => {
        setSelectedFee(fee);
        // Auto-fill amount if WAITING_APPROVAL
        if (fee.status === 'WAITING_APPROVAL' && fee.amount) {
            setInputAmount(fee.amount.toString());
        } else {
            setInputAmount('');
        }
        setShowModal(true);
    };

    const handleViewImage = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setShowImageModal(true);
    };

    const handleReject = async (feeId: number) => {
        if (!confirm('Apakah Anda yakin ingin menolak iuran ini?')) return;

        // TODO: Implement reject endpoint if needed
        alert('Fitur reject belum diimplementasikan');
    };

    const handleConfirmApprove = async () => {
        if (!selectedFee) return;

        // Validate amount for WAITING_MANUAL_INPUT
        if (selectedFee.status === 'WAITING_MANUAL_INPUT' && !inputAmount) {
            alert('Nominal wajib diisi untuk status WAITING_MANUAL_INPUT');
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            const body: { amount?: number } = {};
            if (inputAmount) {
                body.amount = parseInt(inputAmount);
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee/${selectedFee.id}/complete`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
                }
            );

            if (response.ok) {
                alert('Iuran berhasil disetujui!');
                setShowModal(false);
                setSelectedFee(null);
                setInputAmount('');
                fetchData(); // Refresh data
            } else {
                const error = await response.json();
                alert(`Gagal menyetujui: ${error.message}`);
            }
        } catch (error) {
            console.error('Approve error:', error);
            alert('Gagal menyetujui iuran');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '-';
        return amount.toLocaleString('id-ID');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        if (status === 'WAITING_APPROVAL') {
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        } else if (status === 'WAITING_MANUAL_INPUT') {
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    };

    if (!isLoggedIn) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
            {/* Header */}
            <header className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <MdArrowBack className="text-2xl" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">Approval Iuran</h1>
                        <p className="text-sm text-blue-100">Setujui atau tolak iuran bulanan</p>
                    </div>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="p-4 grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Waiting Approval</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.waitingApproval}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manual Input</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.waitingManualInput}</p>
                </div>
            </div>

            {/* Table */}
            <main className="p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : fees.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Tidak ada iuran yang perlu disetujui</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Rumah</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Nominal</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Bukti</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {fees.map((fee) => (
                                        <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {fee.block} / {fee.houseNumber}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">{fee.fullName}</span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(fee.date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    Rp {formatCurrency(fee.amount)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {fee.imageUrl ? (
                                                    <button
                                                        onClick={() => handleViewImage(fee.imageUrl!)}
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm cursor-pointer"
                                                    >
                                                        <MdImage className="text-lg" />
                                                        Lihat
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(fee.status)}`}>
                                                    {fee.status === 'WAITING_APPROVAL' ? 'Waiting' : 'Manual Input'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleApprove(fee)}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                                                    >
                                                        <MdCheckCircle className="text-base" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(fee.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                                    >
                                                        <MdCancel className="text-base" />
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Approval Modal */}
            {showModal && selectedFee && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !isSubmitting && setShowModal(false)}
                    />

                    {/* Modal */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Konfirmasi Approval
                        </h3>

                        <div className="space-y-3 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Rumah</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedFee.block} / {selectedFee.houseNumber} - {selectedFee.fullName}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(selectedFee.status)}`}>
                                    {selectedFee.status}
                                </span>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Nominal (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={inputAmount}
                                    onChange={(e) => setInputAmount(e.target.value)}
                                    disabled={selectedFee.status === 'WAITING_APPROVAL'}
                                    placeholder="Masukkan nominal"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                                />
                                {selectedFee.status === 'WAITING_APPROVAL' && (
                                    <p className="text-xs text-gray-500 mt-1">Nominal terdeteksi otomatis dari OCR</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmApprove}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Memproses...' : 'Setujui'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {showImageModal && selectedImageUrl && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/90"
                        onClick={() => setShowImageModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                        >
                            <MdClose className="text-white text-2xl" />
                        </button>

                        {/* Image */}
                        <img
                            src={selectedImageUrl}
                            alt="Bukti Transfer"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
