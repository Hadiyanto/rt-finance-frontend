'use client';

import React, { useState, useRef, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import { MdInfo, MdEdit, MdCheck, MdDelete, MdAddAPhoto, MdSend, MdClose, MdCheckCircle, MdError } from 'react-icons/md';

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Generate years: Current year - 1 to Current year + 5
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

// Types for block/house data
interface BlockData {
    block: string;
    houses: string[];
}

interface BlockHousesResponse {
    totalBlocks: number;
    data: BlockData[];
}

interface PickerProps {
    items: string[] | number[];
    selected: string | number;
    onSelect: (item: any) => void;
}

const Picker = ({ items, selected, onSelect }: PickerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Scroll to selected item on mount/update
    useEffect(() => {
        if (containerRef.current) {
            const selectedIndex = items.indexOf(selected as never);
            if (selectedIndex !== -1) {
                const itemHeight = 44; // h-11 is 44px
                const scrollPos = selectedIndex * itemHeight;
                containerRef.current.scrollTo({
                    top: scrollPos,
                    behavior: 'smooth'
                });
            }
        }
    }, [selected, items]);

    // Handle scroll end to auto-select centered item
    const handleScroll = () => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            if (containerRef.current) {
                const scrollTop = containerRef.current.scrollTop;
                const itemHeight = 44;
                const closestIndex = Math.round(scrollTop / itemHeight);
                const clampedIndex = Math.max(0, Math.min(closestIndex, items.length - 1));

                if (items[clampedIndex] !== selected) {
                    onSelect(items[clampedIndex]);
                }
            }
        }, 100); // Debounce 100ms after scroll ends
    };

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="h-[132px] overflow-y-auto snap-y snap-mandatory no-scrollbar relative"
        >
            {/* Spacer for centering first item */}
            <div className="h-[44px]"></div>

            {items.map((item) => (
                <div
                    key={item}
                    onClick={() => onSelect(item)}
                    className={`snap-center h-11 flex items-center justify-center cursor-pointer transition-all px-4 truncate text-center ${selected === item
                        ? "text-primary dark:text-white text-sm font-bold leading-normal tracking-[0.015em] rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/30"
                        : "text-gray-400 dark:text-gray-600 text-sm font-bold leading-normal tracking-[0.015em]"
                        }`}
                >
                    {item}
                </div>
            ))}

            {/* Spacer for centering last item */}
            <div className="h-[44px]"></div>
        </div>
    );
};

export default function HomePage() {
    const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [amount, setAmount] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Block/House selection state
    const [blocksData, setBlocksData] = useState<BlockData[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string>("");
    const [residentName, setResidentName] = useState<string>("");
    const [originalResidentName, setOriginalResidentName] = useState<string>("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{ name?: string; amount?: string }>({});
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Fetch blocks data on mount
    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/block-houses`);
                if (response.ok) {
                    const data: BlockHousesResponse = await response.json();
                    setBlocksData(data.data);
                    // Set first address as default and fetch resident name
                    if (data.data.length > 0 && data.data[0].houses.length > 0) {
                        const block = data.data[0].block;
                        const house = data.data[0].houses[0];
                        setSelectedAddress(`${block}/${house}`);

                        // Fetch resident name for default address
                        try {
                            const resResponse = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/api/residents/${block}/${house}`
                            );
                            if (resResponse.ok) {
                                const resData = await resResponse.json();
                                const name = resData.fullName || "";
                                setResidentName(name);
                                setOriginalResidentName(name);
                            }
                        } catch {
                            // Ignore error for initial resident fetch
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch blocks:", error);
            } finally {
                setIsLoadingBlocks(false);
            }
        };
        fetchBlocks();
    }, []);

    // Auto-dismiss toast after 4 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Generate flat list of all addresses
    const allAddresses = blocksData.flatMap(b =>
        b.houses.map(h => `${b.block}/${h}`)
    );

    const handleAddressChange = async (address: string) => {
        setSelectedAddress(address);
        setResidentName(""); // Reset name while loading
        setOriginalResidentName("");
        setIsEditingName(false);
        localStorage.removeItem("edit_name");

        // Fetch resident name from API
        const [block, house] = address.split("/");
        if (block && house) {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/residents/${block}/${house}`
                );
                if (response.ok) {
                    const data = await response.json();
                    const name = data.fullName || "";
                    setResidentName(name);
                    setOriginalResidentName(name);
                }
            } catch (error) {
                console.error("Failed to fetch resident:", error);
            }
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digit characters
        const value = e.target.value.replace(/\D/g, "");

        if (value === "") {
            setAmount("");
            return;
        }

        // Format with thousands separator (dot for IDR)
        const formatted = new Intl.NumberFormat("id-ID").format(parseInt(value));
        setAmount(formatted);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                alert("Hanya file gambar yang diperbolehkan");
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Ukuran file maksimal 5MB");
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
            fileInputRef.current.value = "";
        }
    };

    const handleSubmitClick = () => {
        const errors: { name?: string; amount?: string } = {};

        if (!residentName.trim()) {
            errors.name = "Nama penghuni harus diisi";
        }
        if (!amount.trim()) {
            errors.amount = "Jumlah pembayaran harus diisi";
        }

        setValidationErrors(errors);

        if (Object.keys(errors).length === 0) {
            setShowSummary(true);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);

        try {
            let imageUrl = "";

            // Step 1: Upload image if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append("image", selectedFile);

                const uploadResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/upload-image`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (!uploadResponse.ok) {
                    throw new Error("Failed to upload image");
                }

                const uploadData = await uploadResponse.json();
                imageUrl = uploadData.imageUrl;
            }

            // Step 2: Submit payment data
            const [block, houseNumber] = selectedAddress.split("/");

            // Format date as YYYY-MM
            const monthIndex = MONTHS.indexOf(selectedMonth as string) + 1;
            const dateStr = `${selectedYear}-${monthIndex.toString().padStart(2, "0")}`;

            const paymentResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee-manual`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        block,
                        houseNumber,
                        date: dateStr,
                        name: residentName,
                        imageUrl,
                    }),
                }
            );

            if (!paymentResponse.ok) {
                throw new Error("Failed to submit payment");
            }

            setShowSummary(false);
            setToast({ type: 'success', message: 'Laporan berhasil dikirim!' });

            // Reset form
            setAmount("");
            setSelectedFile(null);
            setPreviewUrl(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (error) {
            console.error("Submit error:", error);
            setToast({ type: 'error', message: 'Gagal mengirim laporan. Silakan coba lagi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen w-full bg-background-light dark:bg-background-dark flex justify-center font-display">
            <div className="relative flex min-h-screen w-full max-w-[430px] mx-auto flex-col bg-white dark:bg-background-dark overflow-x-hidden shadow-xl pb-24">
                {/* Header */}
                <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-center sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 h-14">
                    <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">Setor Iuran Bulanan</h2>
                </div>

                <div className="p-4">
                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-primary/10 border border-primary/20 p-4 rounded-xl mb-6">
                        <div className="flex gap-3">
                            <MdInfo className="text-primary text-xl" />
                            <p className="text-sm text-[#111418] dark:text-gray-200 leading-relaxed">
                                Pastikan data bulan dan nominal sesuai dengan kwitansi atau bukti transfer Anda sebelum menekan tombol Kirim.
                            </p>
                        </div>
                    </div>

                    {/* Pilih Blok dan Nomor Rumah */}
                    <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-4">Blok / Nomor Rumah</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Pilih blok dan nomor rumah Anda.</p>

                    <div className="mb-4">
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Alamat</label>
                        <select
                            value={selectedAddress}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            disabled={isLoadingBlocks}
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111418] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                        >
                            {isLoadingBlocks ? (
                                <option>Loading...</option>
                            ) : (
                                allAddresses.map((addr) => (
                                    <option key={addr} value={addr}>{addr}</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Resident Name (auto-filled) */}
                    <div className="mb-6">
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Nama Penghuni</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={residentName}
                                readOnly={!isEditingName}
                                onChange={(e) => {
                                    // Auto-capitalize first letter of each word
                                    const capitalized = e.target.value
                                        .toLowerCase()
                                        .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
                                    setResidentName(capitalized);
                                    // Save to localStorage if name differs from original
                                    if (capitalized !== originalResidentName) {
                                        localStorage.setItem("edit_name", "true");
                                    } else {
                                        localStorage.removeItem("edit_name");
                                    }
                                }}
                                placeholder="Akan terisi otomatis..."
                                className={`flex-1 h-12 px-4 rounded-xl border font-medium focus:outline-none transition-colors ${isEditingName
                                    ? "border-primary bg-white dark:bg-gray-800 text-[#111418] dark:text-white cursor-text focus:ring-2 focus:ring-primary"
                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-[#111418] dark:text-white cursor-not-allowed"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setIsEditingName(!isEditingName)}
                                className={`h-12 px-4 rounded-xl font-semibold transition-colors flex items-center gap-1 ${isEditingName
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    }`}
                            >
                                {isEditingName ? <MdCheck className="text-xl" /> : <MdEdit className="text-xl" />}
                            </button>
                        </div>
                        {validationErrors.name && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                        )}
                    </div>

                    {/* Pilih Periode Iuran */}
                    <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-4">Pilih Periode Iuran</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Geser untuk memilih bulan dan tahun pembayaran.</p>

                    <div className="flex px-0 py-1 mb-6 relative">
                        {/* Gradient Overlay for visual dept - optional but nice */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-transparent to-white dark:from-background-dark dark:to-background-dark z-10 opacity-60"></div>

                        <div className="group flex-1 z-0">
                            <Picker
                                items={MONTHS}
                                selected={selectedMonth}
                                onSelect={setSelectedMonth}
                            />
                        </div>
                        <div className="group flex-1 ml-2 z-0">
                            <Picker
                                items={YEARS}
                                selected={selectedYear}
                                onSelect={setSelectedYear}
                            />
                        </div>
                    </div>

                    {/* Jumlah Pembayaran */}
                    <div className="flex flex-col gap-4 py-3 mb-4">
                        <label className="flex flex-col w-full">
                            <p className="text-[#111418] dark:text-white text-base font-semibold leading-normal pb-2">Jumlah Pembayaran (Rp)</p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">Rp</span>
                                <input
                                    className="form-input flex w-full rounded-xl text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-14 placeholder:text-[#617589] pl-12 pr-4 text-lg font-bold leading-normal"
                                    placeholder="50.000"
                                    type="text"
                                    inputMode="numeric"
                                    value={amount}
                                    onChange={handleAmountChange}
                                />
                            </div>
                            {validationErrors.amount && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.amount}</p>
                            )}
                        </label>
                    </div>

                    {/* Bukti Pembayaran */}
                    <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-4">Bukti Pembayaran</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Unggah foto struk transfer atau kwitansi fisik.</p>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {previewUrl ? (
                        // Preview state
                        <div className="relative w-full rounded-xl overflow-hidden border-2 border-primary/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewUrl}
                                alt="Preview bukti pembayaran"
                                className="w-full h-auto max-h-[300px] object-contain bg-gray-100 dark:bg-gray-800"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    onClick={handleUploadClick}
                                    className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title="Ganti foto"
                                >
                                    <MdEdit className="text-gray-600 dark:text-gray-300" />
                                </button>
                                <button
                                    onClick={handleRemoveFile}
                                    className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Hapus foto"
                                >
                                    <MdDelete className="text-red-500" />
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                <p className="text-white text-sm truncate">{selectedFile?.name}</p>
                            </div>
                        </div>
                    ) : (
                        // Upload state
                        <div
                            onClick={handleUploadClick}
                            className="flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-6 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className="bg-primary/10 p-3 rounded-full mb-2">
                                    <MdAddAPhoto className="text-primary text-3xl" />
                                </div>
                                <p className="text-[#111418] dark:text-white font-semibold">Ketuk untuk Ambil Foto</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Atau pilih file dari galeri (JPG, PNG max. 5MB)</p>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-10 mb-8 flex flex-col gap-3">
                        <button
                            onClick={handleSubmitClick}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                            <MdSend className="text-xl" />
                            Kirim Laporan
                        </button>
                    </div>
                </div>

                <BottomNav />
            </div>

            {/* Summary Bottom Sheet */}
            {showSummary && (
                <div className="fixed inset-0 z-[100]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 transition-opacity"
                        onClick={() => setShowSummary(false)}
                    />

                    {/* Sheet */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-6 transform transition-transform animate-slide-up">
                        {/* Handle */}
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#111418] dark:text-white">Konfirmasi Pembayaran</h3>
                            <button
                                onClick={() => setShowSummary(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <MdClose className="text-2xl text-gray-500" />
                            </button>
                        </div>

                        {/* Summary Details */}
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-gray-500 dark:text-gray-400">Blok / No. Rumah</span>
                                <span className="font-semibold text-[#111418] dark:text-white">{selectedAddress}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-gray-500 dark:text-gray-400">Nama Penghuni</span>
                                <span className="font-semibold text-[#111418] dark:text-white">{residentName}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-gray-500 dark:text-gray-400">Periode</span>
                                <span className="font-semibold text-[#111418] dark:text-white">{selectedMonth} {selectedYear}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-gray-500 dark:text-gray-400">Jumlah Pembayaran</span>
                                <span className="font-bold text-lg text-primary">Rp {amount}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSummary(false)}
                                className="flex-1 py-4 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-4 rounded-xl font-semibold bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <MdCheck className="text-xl" />
                                        Konfirmasi
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-[400px] w-[calc(100%-2rem)] animate-slide-down">
                    <div className={`flex items-center gap-3 p-4 rounded-xl shadow-lg ${toast.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                        }`}>
                        {toast.type === 'success' ? (
                            <MdCheckCircle className="text-2xl flex-shrink-0" />
                        ) : (
                            <MdError className="text-2xl flex-shrink-0" />
                        )}
                        <p className="flex-1 font-medium">{toast.message}</p>
                        <button
                            onClick={() => setToast(null)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <MdClose className="text-xl" />
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
