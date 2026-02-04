'use client';

import React from 'react';
import { MdNotifications, MdNotificationsActive } from 'react-icons/md';
import NotificationService from '@/utils/notificationService';

export default function NotificationSettings() {
    const [permission, setPermission] = React.useState<NotificationPermission>('default');

    React.useEffect(() => {
        setPermission(NotificationService.getPermission());
    }, []);

    const handleRequestPermission = async () => {
        const granted = await NotificationService.requestPermission();
        setPermission(granted);

        if (granted === 'granted') {
            await NotificationService.registerServiceWorker();
            await NotificationService.showLocalNotification({
                title: '✅ Notifikasi Berhasil Diaktifkan',
                body: `Anda akan menerima notifikasi penting dari GMM 001`,
            });
        }
    };

    const handleTestNotification = async () => {
        if (permission === 'granted') {
            await NotificationService.showLocalNotification({
                title: '🔔 Test Notifikasi',
                body: 'Ini adalah test notifikasi dari RT Finance',
                url: '/',
            });
        } else {
            alert('Silakan aktifkan notifikasi terlebih dahulu');
        }
    };

    const getStatusText = () => {
        switch (permission) {
            case 'granted':
                return { text: 'Aktif', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
            case 'denied':
                return { text: 'Diblokir', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
            default:
                return { text: 'Tidak Aktif', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' };
        }
    };

    const status = getStatusText();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status.bg}`}>
                        {permission === 'granted' ? (
                            <MdNotificationsActive className={`text-2xl ${status.color}`} />
                        ) : (
                            <MdNotifications className={`text-2xl ${status.color}`} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifikasi Push</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Status: <span className={`font-medium ${status.color}`}>{status.text}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {permission !== 'granted' && permission !== 'denied' && (
                    <button
                        onClick={handleRequestPermission}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        Aktifkan Notifikasi
                    </button>
                )}

                {permission === 'granted' && (
                    <button
                        onClick={handleTestNotification}
                        className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        Test Notifikasi
                    </button>
                )}

                {permission === 'denied' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Notifikasi diblokir. Silakan aktifkan melalui pengaturan browser Anda.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    📱 Notifikasi membantu Anda mendapatkan pengingat iuran bulanan dan update penting lainnya.
                </p>
            </div>
        </div>
    );
}
