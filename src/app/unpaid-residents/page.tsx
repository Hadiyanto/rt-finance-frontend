'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MdFileDownload, MdArrowBack, MdMessage, MdClose } from 'react-icons/md';

interface UnpaidResident {
    id: number;
    block: string;
    houseNumber: string;
    fullName: string;
    phoneNumber: string | null;
    totalMonths: number;
    paidMonths: number;
    unpaidMonths: number;
}

interface ApiResponse {
    startMonth: string;
    endMonth: string;
    totalMonths: number;
    totalResidents: number;
    residentsWithUnpaid: number;
    data: UnpaidResident[];
}

const MESSAGE_TEMPLATES = {
    reminder: `Kepada Bapak/Ibu [NAMA],

Kami ingin mengingatkan bahwa terdapat tunggakan pembayaran iuran RT sebanyak [BULAN] bulan.

Mohon segera melakukan pembayaran. Terima kasih atas perhatian dan kerjasamanya.

Hormat kami,
Pengurus RT`,
    gentle: `Halo Bapak/Ibu [NAMA],

Semoga sehat selalu. Kami ingin mengingatkan bahwa masih ada tunggakan iuran RT sebanyak [BULAN] bulan.

Jika sudah dibayar, mohon informasikan kepada kami. Jika belum, kami tunggu pembayarannya ya.

Terima kasih 🙏`,
    urgent: `PENTING - Reminder Iuran RT

Kepada: Bapak/Ibu [NAMA]
Tunggakan: [BULAN] bulan

Mohon segera melakukan pembayaran untuk menghindari penumpukan tunggakan lebih lanjut.

Hubungi RT untuk informasi lebih lanjut.`,
};

export default function UnpaidResidentsPage() {
    const router = useRouter();
    const [data, setData] = useState<ApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Default: current year
    const currentYear = new Date().getFullYear();
    const [startMonth, setStartMonth] = useState(`${currentYear}-01`);
    const [endMonth, setEndMonth] = useState(`${currentYear}-12`);

    // Selection state
    const [selectedResidents, setSelectedResidents] = useState<Set<number>>(new Set());

    // Message modal state
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageTemplate, setMessageTemplate] = useState<keyof typeof MESSAGE_TEMPLATES>('reminder');
    const [customMessage, setCustomMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchData();
        loadSelectedFromStorage();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/unpaid-residents/range?startMonth=${startMonth}&endMonth=${endMonth}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                alert('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching unpaid residents:', error);
            alert('Error fetching data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadSelectedFromStorage = () => {
        const stored = localStorage.getItem('unpaid_selected_residents');
        if (stored) {
            try {
                const ids = JSON.parse(stored);
                setSelectedResidents(new Set(ids));
            } catch (error) {
                console.error('Error loading selections:', error);
            }
        }
    };

    const saveSelectedToStorage = (selected: Set<number>) => {
        localStorage.setItem('unpaid_selected_residents', JSON.stringify(Array.from(selected)));
    };

    const handleSelectResident = (residentId: number, phoneNumber: string | null) => {
        if (!phoneNumber) {
            alert('Warga ini tidak memiliki nomor HP yang terdaftar');
            return;
        }

        const newSelected = new Set(selectedResidents);
        if (newSelected.has(residentId)) {
            newSelected.delete(residentId);
        } else {
            newSelected.add(residentId);
        }
        setSelectedResidents(newSelected);
        saveSelectedToStorage(newSelected);
    };

    const handleSelectAll = () => {
        const unpaidResidents = data?.data.filter(r => r.unpaidMonths > 0 && r.phoneNumber) || [];
        if (selectedResidents.size === unpaidResidents.length) {
            // Deselect all
            setSelectedResidents(new Set());
            saveSelectedToStorage(new Set());
        } else {
            // Select all with phone numbers
            const allIds = new Set(unpaidResidents.map(r => r.id));
            setSelectedResidents(allIds);
            saveSelectedToStorage(allIds);
        }
    };

    const getSelectedResidents = () => {
        return data?.data.filter(r => selectedResidents.has(r.id)) || [];
    };

    const handleOpenMessageModal = () => {
        if (selectedResidents.size === 0) {
            alert('Pilih minimal 1 warga untuk dikirim pesan');
            return;
        }
        setCustomMessage(MESSAGE_TEMPLATES[messageTemplate]);
        setShowMessageModal(true);
    };

    const handleTemplateChange = (template: keyof typeof MESSAGE_TEMPLATES) => {
        setMessageTemplate(template);
        setCustomMessage(MESSAGE_TEMPLATES[template]);
    };

    const handleSendMessages = async () => {
        const selected = getSelectedResidents();
        if (selected.length === 0) {
            alert('Tidak ada warga yang dipilih');
            return;
        }

        if (!customMessage.trim()) {
            alert('Pesan tidak boleh kosong');
            return;
        }

        const confirmed = confirm(
            `Kirim reminder ke ${selected.length} warga?\n\n` +
            `Proses akan memakan waktu ~${Math.ceil(selected.length * 3)} detik untuk menghindari spam detection.`
        );

        if (!confirmed) return;

        setIsSending(true);

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            let successCount = 0;
            let failCount = 0;

            // Send with delay to avoid bot detection
            for (let i = 0; i < selected.length; i++) {
                const resident = selected[i];

                try {
                    // Replace placeholders for this specific resident
                    let personalizedMessage = customMessage
                        .replace(/\[NAMA\]/g, resident.fullName)
                        .replace(/\[BULAN\]/g, resident.unpaidMonths.toString())
                        .replace(/\[BLOK\]/g, resident.block)
                        .replace(/\[NO_RUMAH\]/g, resident.houseNumber);

                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/send`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            type: 'individual',
                            phoneNumbers: [resident.phoneNumber],
                            message: personalizedMessage,
                        }),
                    });

                    if (response.ok) {
                        successCount++;
                        console.log(`✓ Sent to ${resident.fullName} (${i + 1}/${selected.length})`);
                    } else {
                        failCount++;
                        console.error(`✗ Failed to send to ${resident.fullName}`);
                    }
                } catch (error) {
                    failCount++;
                    console.error(`✗ Error sending to ${resident.fullName}:`, error);
                }

                // Add random delay between 5-10 seconds (except for last message)
                if (i < selected.length - 1) {
                    const delay = 5000 + Math.random() * 5000; // 5-10 seconds
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } ``

            if (failCount > 0) {
                alert(`✅ Berhasil: ${successCount}\n❌ Gagal: ${failCount}`);
            } else {
                alert(`✅ Pesan berhasil dikirim ke ${successCount} warga!`);
                // Clear selections after successful send
                setSelectedResidents(new Set());
                saveSelectedToStorage(new Set());
            }

            setShowMessageModal(false);
        } catch (error) {
            console.error('Error sending messages:', error);
            alert('Gagal mengirim pesan. Silakan coba lagi.');
        } finally {
            setIsSending(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            await import('jspdf-autotable');

            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text('Laporan Warga Belum Bayar Iuran', 14, 15);

            doc.setFontSize(11);
            doc.text(`Periode: ${startMonth} s/d ${endMonth}`, 14, 22);
            doc.text(`Total: ${data?.residentsWithUnpaid || 0} warga belum bayar`, 14, 28);

            const unpaidOnly = data?.data.filter(r => r.unpaidMonths > 0) || [];

            (doc as any).autoTable({
                startY: 35,
                head: [['No', 'Blok', 'No Rumah', 'Nama', 'Total Bulan', 'Sudah Bayar', 'Belum Bayar']],
                body: unpaidOnly.map((resident, idx) => [
                    idx + 1,
                    resident.block,
                    resident.houseNumber,
                    resident.fullName,
                    resident.totalMonths,
                    resident.paidMonths,
                    resident.unpaidMonths,
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246] },
            });

            const fileName = `Laporan_Tunggakan_${startMonth}_${endMonth}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const unpaidResidents = data?.data.filter(r => r.unpaidMonths > 0) || [];
    const residentsWithPhone = unpaidResidents.filter(r => r.phoneNumber);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <MdArrowBack />
                        Kembali
                    </button>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Laporan Warga Belum Bayar Iuran
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Daftar warga yang memiliki tunggakan pembayaran iuran
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bulan Mulai
                            </label>
                            <input
                                type="month"
                                value={startMonth}
                                onChange={(e) => setStartMonth(e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bulan Akhir
                            </label>
                            <input
                                type="month"
                                value={endMonth}
                                onChange={(e) => setEndMonth(e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Tampilkan'}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Warga</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.totalResidents}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Bulan</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.totalMonths}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Warga Tunggakan</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {data.residentsWithUnpaid}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting || unpaidResidents.length === 0}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MdFileDownload className="text-xl" />
                                {isExporting ? 'Exporting...' : 'Export PDF'}
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                            <button
                                onClick={handleOpenMessageModal}
                                disabled={selectedResidents.size === 0}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MdMessage className="text-xl" />
                                Kirim WA ({selectedResidents.size})
                            </button>
                        </div>
                    </div>
                )}

                {/* Selection Info */}
                {selectedResidents.size > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                        <p className="text-blue-800 dark:text-blue-300">
                            ✓ {selectedResidents.size} warga dipilih untuk dikirim reminder via WhatsApp
                        </p>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Loading...
                        </div>
                    ) : unpaidResidents.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Tidak ada warga dengan tunggakan untuk periode ini
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedResidents.size > 0 && selectedResidents.size === residentsWithPhone.length}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                                                disabled={residentsWithPhone.length === 0}
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            No
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Blok
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            No Rumah
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Nama Lengkap
                                        </th>

                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Total Bulan
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Sudah Bayar
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Belum Bayar
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {unpaidResidents.map((resident, idx) => (
                                        <tr key={resident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedResidents.has(resident.id)}
                                                    onChange={() => handleSelectResident(resident.id, resident.phoneNumber)}
                                                    disabled={!resident.phoneNumber}
                                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {resident.block}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {resident.houseNumber}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {resident.fullName}
                                                {!resident.phoneNumber && (
                                                    <span className="ml-2 text-xs text-gray-400">(No HP)</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                                                {resident.totalMonths}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-green-600 dark:text-green-400">
                                                {resident.paidMonths}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full font-medium">
                                                    {resident.unpaidMonths}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Modal */}
            {showMessageModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Kirim Reminder WhatsApp
                            </h2>
                            <button
                                onClick={() => setShowMessageModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <MdClose className="text-2xl" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Recipients */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Penerima ({selectedResidents.size} warga)
                                </label>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                                    {getSelectedResidents().map(r => (
                                        <div key={r.id} className="text-sm text-gray-600 dark:text-gray-400">
                                            • {r.fullName} ({r.block}-{r.houseNumber}) - {r.unpaidMonths} bulan
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Template Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Template Pesan
                                </label>
                                <select
                                    value={messageTemplate}
                                    onChange={(e) => handleTemplateChange(e.target.value as keyof typeof MESSAGE_TEMPLATES)}
                                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                >
                                    <option value="reminder">Reminder Standar</option>
                                    <option value="gentle">Reminder Sopan</option>
                                    <option value="urgent">Reminder Mendesak</option>
                                </select>
                            </div>

                            {/* Message Editor */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Pesan (Edit sesuai kebutuhan)
                                </label>
                                <textarea
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    rows={10}
                                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="Tulis pesan..."
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Placeholder: [NAMA], [BULAN], [BLOK], [NO_RUMAH]
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowMessageModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSendMessages}
                                    disabled={isSending}
                                    className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSending ? 'Mengirim...' : `Kirim ke ${selectedResidents.size} Warga`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
