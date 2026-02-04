// Notification utility functions

export interface NotificationData {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
}

export class NotificationService {
    private static instance: NotificationService;

    private constructor() { }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Request notification permission from user
     */
    async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission;
        }

        return Notification.permission;
    }

    /**
     * Check if notifications are supported and permitted
     */
    isSupported(): boolean {
        return 'Notification' in window && 'serviceWorker' in navigator;
    }

    /**
     * Get current notification permission status
     */
    getPermission(): NotificationPermission {
        if (!('Notification' in window)) {
            return 'denied';
        }
        return Notification.permission;
    }

    /**
     * Register service worker for push notifications
     */
    async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers are not supported');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }

    /**
     * Show a local notification (without push server)
     */
    async showLocalNotification(data: NotificationData): Promise<void> {
        const permission = await this.requestPermission();

        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/images/icons/icon-192.png',
            badge: '/images/icons/icon-192.png',
            tag: data.tag || 'default',
            data: {
                url: data.url || '/',
            },
        });
    }

    /**
     * Schedule a notification for later (using setTimeout)
     */
    scheduleNotification(data: NotificationData, delayMs: number): number {
        const timeoutId = window.setTimeout(() => {
            this.showLocalNotification(data);
        }, delayMs);

        return timeoutId;
    }

    /**
     * Cancel a scheduled notification
     */
    cancelScheduledNotification(timeoutId: number): void {
        window.clearTimeout(timeoutId);
    }

    /**
     * Check if it's time to remind for monthly fee (example usage)
     */
    shouldRemindMonthlyFee(): boolean {
        const today = new Date();
        const dayOfMonth = today.getDate();

        // Remind on the 1st, 10th, and 20th of each month
        return dayOfMonth === 1 || dayOfMonth === 10 || dayOfMonth === 20;
    }

    /**
     * Send monthly fee reminder notification
     */
    async sendMonthlyFeeReminder(userName: string, amount: number): Promise<void> {
        await this.showLocalNotification({
            title: '💰 Pengingat Iuran Bulanan',
            body: `Halo ${userName}, jangan lupa bayar iuran bulanan sebesar Rp ${amount.toLocaleString('id-ID')}`,
            url: '/',
            tag: 'monthly-fee-reminder',
        });
    }

    /**
     * Send approval notification for admin
     */
    async sendApprovalNotification(count: number): Promise<void> {
        await this.showLocalNotification({
            title: '🔔 Approval Diperlukan',
            body: `Ada ${count} iuran yang menunggu persetujuan Anda`,
            url: '/approval-iuran',
            tag: 'approval-needed',
        });
    }

    /**
     * Send payment confirmation notification
     */
    async sendPaymentConfirmation(status: 'approved' | 'rejected'): Promise<void> {
        const title = status === 'approved' ? '✅ Pembayaran Disetujui' : '❌ Pembayaran Ditolak';
        const body = status === 'approved'
            ? 'Pembayaran iuran Anda telah disetujui'
            : 'Pembayaran iuran Anda ditolak, silakan hubungi admin';

        await this.showLocalNotification({
            title,
            body,
            url: '/',
            tag: 'payment-status',
        });
    }
}

// Export singleton instance
export default NotificationService.getInstance();
