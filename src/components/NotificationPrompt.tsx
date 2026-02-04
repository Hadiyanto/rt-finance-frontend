'use client';

import React, { useState, useEffect } from 'react';
import { MdNotifications, MdNotificationsOff, MdClose } from 'react-icons/md';
import NotificationService from '@/utils/notificationService';

export default function NotificationPrompt() {
    const [show, setShow] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Check current permission status
        const currentPermission = NotificationService.getPermission();
        setPermission(currentPermission);

        // Show prompt if permission is default (not asked yet)
        if (currentPermission === 'default' && NotificationService.isSupported()) {
            // Wait a bit before showing prompt (don't annoy user immediately)
            const timer = setTimeout(() => {
                setShow(true);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleEnable = async () => {
        try {
            console.log('Requesting notification permission...');
            const granted = await NotificationService.requestPermission();
            console.log('Permission result:', granted);
            setPermission(granted);

            if (granted === 'granted') {
                console.log('Permission granted! Registering service worker...');
                // Register service worker
                await NotificationService.registerServiceWorker();

                // Show welcome notification
                await NotificationService.showLocalNotification({
                    title: '🎉 Notifikasi Aktif!',
                    body: 'Anda akan menerima pengingat iuran bulanan',
                    url: '/',
                });
                console.log('Welcome notification sent!');
            } else {
                console.warn('Permission denied or dismissed');
                alert('Notifikasi tidak dapat diaktifkan. Status: ' + granted);
            }

            setShow(false);
        } catch (error) {
            console.error('Error enabling notifications:', error);
            alert('Terjadi error: ' + error);
        }
    };

    const handleDismiss = () => {
        setShow(false);
        // Remember user dismissed (optional - use localStorage)
        localStorage.setItem('notification-prompt-dismissed', 'true');
    };

    if (!show || !NotificationService.isSupported()) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-0 right-0 z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                        <MdNotifications className="text-2xl text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                            Aktifkan Notifikasi
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Dapatkan pengingat iuran bulanan dan notifikasi penting lainnya
                        </p>

                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleEnable}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Aktifkan
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                            >
                                Nanti
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>
            </div>
        </div>
    );
}
