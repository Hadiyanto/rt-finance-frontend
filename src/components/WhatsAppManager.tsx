'use client';

import React, { useState, useEffect } from 'react';
import { MdQrCode, MdRefresh, MdSend, MdCheckCircle, MdError, MdClose, MdSync } from 'react-icons/md';
import Image from 'next/image';
import NotificationService from '@/utils/notificationService';

interface Contact {
    id: number;
    fullName: string;
    phoneNumber: string;
    block: string;
    houseNumber: string;
}

export default function WhatsAppManager() {
    const [isConnected, setIsConnected] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);

    // Message modal states
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [recipient, setRecipient] = useState<'individual' | 'group' | 'all'>('individual');
    const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
    const [manualPhone, setManualPhone] = useState(''); // Manual phone input
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        checkStatus();
        fetchContacts();
        // No polling - only check on mount
    }, []);

    const checkStatus = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/status`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setIsConnected(data.connected);

                // If not connected and no QR, fetch QR
                if (!data.connected && !qrCode) {
                    fetchQR();
                } else if (data.connected) {
                    setQrCode(null);
                }
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    };

    const fetchQR = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/qr`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.qr) {
                    setQrCode(data.qr);
                } else if (data.connected) {
                    setIsConnected(true);
                    setQrCode(null);
                }
            }
        } catch (error) {
            console.error('Fetch QR error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateQR = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/regenerate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                await NotificationService.showLocalNotification({
                    title: '🔄 QR Code di-Regenerate',
                    body: 'Mohon tunggu sebentar...',
                });
                setQrCode(null);
                setIsConnected(false);

                // Wait a bit then fetch new QR
                setTimeout(fetchQR, 2000);
            }
        } catch (error) {
            console.error('Regenerate QR error:', error);
            await NotificationService.showLocalNotification({
                title: '❌ Gagal Regenerate QR',
                body: 'Terjadi kesalahan, coba lagi.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/contacts`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts || []);
            }
        } catch (error) {
            console.error('Fetch contacts error:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            await NotificationService.showLocalNotification({
                title: '⚠️ Pesan Kosong',
                body: 'Silakan ketik pesan terlebih dahulu',
            });
            return;
        }

        try {
            setIsSending(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            let body: any = {
                recipient,
                message,
            };

            if (recipient === 'individual') {
                // Prioritas manual phone, kalau ga ada baru dari contact
                if (manualPhone.trim()) {
                    body.phone = manualPhone.trim();
                } else if (selectedContacts.length > 0) {
                    const contact = contacts.find(c => c.id === selectedContacts[0]);
                    body.phone = contact?.phoneNumber;
                } else {
                    await NotificationService.showLocalNotification({
                        title: '⚠️ Nomor HP Diperlukan',
                        body: 'Masukkan nomor HP atau pilih kontak',
                    });
                    return;
                }
            } else if (recipient === 'group') {
                if (selectedContacts.length === 0) {
                    await NotificationService.showLocalNotification({
                        title: '⚠️ Kontak Belum Dipilih',
                        body: 'Pilih minimal 1 kontak untuk group',
                    });
                    return;
                }
                body.phones = contacts
                    .filter(c => selectedContacts.includes(c.id))
                    .map(c => c.phoneNumber);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                await NotificationService.showLocalNotification({
                    title: '✅ Pesan Terkirim',
                    body: `Pesan WhatsApp berhasil dikirim!`,
                });
                setShowMessageModal(false);
                setMessage('');
                setSelectedContacts([]);
                setManualPhone('');
            } else {
                const error = await response.json();
                await NotificationService.showLocalNotification({
                    title: '❌ Gagal Kirim Pesan',
                    body: error.message || 'Terjadi kesalahan',
                });
            }
        } catch (error) {
            console.error('Send message error:', error);
            await NotificationService.showLocalNotification({
                title: '❌ Error',
                body: 'Terjadi kesalahan saat mengirim pesan',
            });
        } finally {
            setIsSending(false);
        }
    };

    const toggleContactSelection = (contactId: number) => {
        if (recipient === 'individual') {
            setSelectedContacts([contactId]);
        } else {
            setSelectedContacts(prev =>
                prev.includes(contactId)
                    ? prev.filter(id => id !== contactId)
                    : [...prev, contactId]
            );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <MdQrCode className="text-xl" />
                        WhatsApp Bot
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        {isConnected ? (
                            <>
                                <MdCheckCircle className="text-green-500" />
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected</span>
                            </>
                        ) : (
                            <>
                                <MdError className="text-red-500" />
                                <span className="text-sm text-red-600 dark:text-red-400 font-medium">Disconnected</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={checkStatus}
                        disabled={isLoading}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Check Status"
                    >
                        <MdRefresh className={`text-xl ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleRegenerateQR}
                        disabled={isLoading}
                        className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                        title="Regenerate QR"
                    >
                        <MdSync className={`text-xl ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => setShowMessageModal(true)}
                        disabled={!isConnected}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MdSend className="text-lg" />
                        Kirim Pesan
                    </button>
                </div>
            </div>

            {/* QR Code Display */}
            {!isConnected && qrCode && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                        Scan QR Code dengan WhatsApp Anda
                    </p>
                    <div className="flex justify-center">
                        <Image
                            src={qrCode}
                            alt="WhatsApp QR Code"
                            width={256}
                            height={256}
                            className="rounded-lg"
                        />
                    </div>
                </div>
            )}

            {!isConnected && !qrCode && !isLoading && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        QR Code sedang di-generate... Refresh halaman jika tidak muncul dalam 10 detik.
                    </p>
                </div>
            )}

            {/* Message Modal */}
            {showMessageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !isSending && setShowMessageModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kirim Pesan WhatsApp</h3>
                            <button
                                onClick={() => setShowMessageModal(false)}
                                disabled={isSending}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <MdClose className="text-xl" />
                            </button>
                        </div>

                        {/* Recipient Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Penerima
                            </label>
                            <select
                                value={recipient}
                                onChange={(e) => {
                                    setRecipient(e.target.value as any);
                                    setSelectedContacts([]);
                                    setManualPhone('');
                                }}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="individual">Individual</option>
                                <option value="group">Group (pilih beberapa)</option>
                                <option value="all">Semua Warga</option>
                            </select>
                        </div>

                        {/* Manual Phone Input - For Individual */}
                        {recipient === 'individual' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nomor HP Manual (opsional)
                                </label>
                                <input
                                    type="text"
                                    value={manualPhone}
                                    onChange={(e) => setManualPhone(e.target.value)}
                                    placeholder="628123456789"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Format: 628xxxxxxxxxx (tanpa +, -, atau spasi)
                                </p>
                            </div>
                        )}

                        {/* Contact List */}
                        {recipient !== 'all' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {recipient === 'individual' ? 'Atau Pilih dari Kontak' : `Pilih Kontak (${selectedContacts.length} dipilih)`}
                                </label>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                    {contacts.map((contact) => (
                                        <label
                                            key={contact.id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        >
                                            <input
                                                type={recipient === 'individual' ? 'radio' : 'checkbox'}
                                                name="contact"
                                                checked={selectedContacts.includes(contact.id)}
                                                onChange={() => toggleContactSelection(contact.id)}
                                                className="w-4 h-4"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {contact.fullName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {contact.block}/{contact.houseNumber} • {contact.phoneNumber}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Message */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Pesan
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                placeholder="Ketik pesan disini..."
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowMessageModal(false)}
                                disabled={isSending}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled={isSending}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? 'Mengirim...' : 'Kirim Pesan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
