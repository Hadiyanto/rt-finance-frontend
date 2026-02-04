'use client';

import React, { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import { MdAdd, MdReceipt, MdArrowUpward, MdArrowDownward, MdTrendingUp, MdTrendingDown, MdWallet, MdClose } from 'react-icons/md';

interface FinanceType {
    id: number;
    name: 'income' | 'expense';
}

interface FinanceCategory {
    id: number;
    name: string;
    typeId: number;
    type?: FinanceType;
}

interface FinanceItem {
    id: number;
    amount: number;
    description: string;
    imageUrl: string | null;
    date: string;
    categoryId: number;
    typeId: number;
    category: FinanceCategory;
    type: FinanceType;
}

interface FinanceResponse {
    total: number;
    data: FinanceItem[];
}

interface CategoryResponse {
    total: number;
    data: FinanceCategory[];
}

export default function PengeluaranPage() {
    const [financeData, setFinanceData] = useState<FinanceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

    // Image upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Check login status
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
                if (response.ok) {
                    const data: CategoryResponse = await response.json();
                    setCategories(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance`);
                if (response.ok) {
                    const data: FinanceResponse = await response.json();
                    // Sort by date descending (newest first)
                    const sortedData = data.data.sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setFinanceData(sortedData);
                }
            } catch (error) {
                console.error("Failed to fetch finance data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const typeId = transactionType === 'income' ? 1 : 2;
            const numAmount = parseFloat(amount.replace(/\D/g, ''));

            // Get token from storage
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            let imageUrl = '';

            // Step 1: Upload image if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append('image', selectedFile);

                const uploadResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/upload-image`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image');
                }

                const uploadData = await uploadResponse.json();
                imageUrl = uploadData.imageUrl;
            }

            // Step 2: Submit finance data
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: numAmount,
                    description,
                    categoryId: selectedCategoryId,
                    typeId,
                    date,
                    imageUrl,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }

            // Reset form
            setAmount('');
            setDescription('');
            setSelectedCategoryId('');
            setDate(new Date().toISOString().split('T')[0]);
            setSelectedFile(null);
            setPreviewUrl(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setShowModal(false);

            // Refresh data
            const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance`);
            if (refreshResponse.ok) {
                const data: FinanceResponse = await refreshResponse.json();
                const sortedData = data.data.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setFinanceData(sortedData);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Gagal menyimpan transaksi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Hanya file gambar yang diperbolehkan');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Ukuran file maksimal 5MB');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Calculate totals
    const { totalIncome, totalExpense, balance } = useMemo(() => {
        return financeData.reduce(
            (acc, item) => {
                if (item.type.name === 'income') {
                    acc.totalIncome += item.amount;
                    acc.balance += item.amount;
                } else {
                    acc.totalExpense += item.amount;
                    acc.balance -= item.amount;
                }
                return acc;
            },
            { totalIncome: 0, totalExpense: 0, balance: 0 }
        );
    }, [financeData]);

    const LoadingOverlay = () => {
        if (!isLoading) return null;

        return (
            <div className="fixed inset-0 z-[9999] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Memuat data keuangan...
                </p>
            </div>
        );
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-32 transition-colors duration-200 font-display">
            <LoadingOverlay />
            <div className="h-12 w-full bg-background-light dark:bg-background-dark sticky top-0 z-50"></div>

            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between sticky top-12 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Keuangan</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Laporan Kas RT</p>
                </div>
                {isLoggedIn && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
                    >
                        <MdAdd className="text-2xl" />
                    </button>
                )}
            </header>

            <main className="px-5 space-y-6">
                {/* Summary Card - Balance */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <MdWallet className="text-2xl opacity-80" />
                        <span className="text-sm font-medium opacity-80">Sisa Saldo Kas</span>
                    </div>
                    <p className="text-3xl font-bold">Rp {formatCurrency(balance)}</p>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/20">
                        <div>
                            <div className="flex items-center gap-1 text-blue-100 text-xs mb-1">
                                <MdArrowUpward className="text-emerald-300" />
                                Pemasukan
                            </div>
                            <p className="font-semibold text-lg">Rp {formatCurrency(totalIncome)}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-blue-100 text-xs mb-1">
                                <MdArrowDownward className="text-rose-300" />
                                Pengeluaran
                            </div>
                            <p className="font-semibold text-lg">Rp {formatCurrency(totalExpense)}</p>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <section>
                    <h3 className="text-lg font-bold mb-4">Riwayat Transaksi</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                            <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</span>
                            <span className="col-span-12 md:col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:block">Deskripsi</span>
                            <span className="col-span-5 md:col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block md:hidden">Info</span>
                            <span className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Nominal</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {financeData.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-500">
                                    Belum ada data transaksi
                                </div>
                            ) : (
                                financeData.map((item) => {
                                    const isIncome = item.type.name === 'income';
                                    return (
                                        <div key={item.id} className="grid grid-cols-12 px-4 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="col-span-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        {formatDate(item.date)}
                                                    </span>
                                                    {/* Show category on mobile */}
                                                    <span className="text-[10px] text-slate-400 md:hidden mt-1 line-clamp-1">
                                                        {item.category?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-span-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2">
                                                        {item.description}
                                                    </span>
                                                    {/* Show category on desktop */}
                                                    <span className="text-xs text-slate-400 mt-0.5 hidden md:block">
                                                        {item.category?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-span-4 text-right">
                                                <span className={`text-sm font-bold ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {isIncome ? '+ ' : '- '}
                                                    Rp {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Add Transaction Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 transition-opacity"
                        onClick={() => setShowModal(false)}
                    />

                    {/* Modal */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-6 transform transition-transform max-h-[90vh] overflow-y-auto">
                        {/* Handle */}
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#111418] dark:text-white">Tambah Transaksi</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <MdClose className="text-2xl text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Transaction Type */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Tipe Transaksi
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTransactionType('income');
                                            setSelectedCategoryId('');
                                        }}
                                        className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${transactionType === 'income'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        Pemasukan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTransactionType('expense');
                                            setSelectedCategoryId('');
                                        }}
                                        className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${transactionType === 'expense'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        Pengeluaran
                                    </button>
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Kategori
                                </label>
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories
                                        .filter(cat => cat.typeId === (transactionType === 'income' ? 1 : 2))
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Jumlah
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                                        Rp
                                    </span>
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value === '') {
                                                setAmount('');
                                                return;
                                            }
                                            const formatted = new Intl.NumberFormat('id-ID').format(parseInt(value));
                                            setAmount(formatted);
                                        }}
                                        placeholder="0"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Deskripsi
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Masukkan deskripsi transaksi"
                                    required
                                    rows={3}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Bukti Transaksi (Opsional)
                                </label>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {previewUrl ? (
                                    <div className="relative w-full rounded-xl overflow-hidden border-2 border-primary/30">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-48 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                                        >
                                            <MdClose className="text-xl" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={handleUploadClick}
                                        className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="bg-primary/10 p-2 rounded-full mb-2">
                                            <MdAdd className="text-primary text-2xl" />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Ketuk untuk Upload Foto</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG max. 5MB</p>
                                    </div>
                                )}
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl font-semibold bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white flex items-center justify-center gap-2 transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
