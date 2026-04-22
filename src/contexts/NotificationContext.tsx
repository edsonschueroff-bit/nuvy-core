'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Notification, NotificationType } from '@/types';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (userId: string, title: string, message: string, type: NotificationType, link?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const demoNotificationsFor = (userId: string): Notification[] => [
    {
        id: '1',
        userId,
        title: 'Bem-vindo ao Nuvy Core!',
        message: 'Esta é uma notificação de demonstração da sua nova plataforma de ativos.',
        type: 'success',
        read: false,
        createdAt: new Date()
    },
    {
        id: '2',
        userId,
        title: 'Repasse Disponível',
        message: 'Você tem um novo repasse pendente de R$ 4.500,00.',
        type: 'info',
        link: '/dashboard/financeiro',
        read: false,
        createdAt: new Date(Date.now() - 3600000)
    }
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { profile, demoMode } = useAuth();
    const [notifications, setNotifications] = useState<Notification[] | null>(null);

    const isDemoSession = Boolean(profile) && (!isFirebaseConfigured || demoMode);
    const visibleNotifications = profile
        ? (isDemoSession ? demoNotificationsFor(profile.uid) : notifications ?? [])
        : [];
    const unreadCount = visibleNotifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!profile) {
            return;
        }

        if (isDemoSession) {
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', profile.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data(),
                createdAt: item.data().createdAt?.toDate?.() || new Date(),
            })) as Notification[];
            setNotifications(data);
        });

        return () => unsubscribe();
    }, [profile, isDemoSession]);

    const markAsRead = async (id: string) => {
        if (!isFirebaseConfigured || demoMode) {
            setNotifications(prev => (prev ?? []).map(n => n.id === id ? { ...n, read: true } : n));
            return;
        }
        await updateDoc(doc(db, 'notifications', id), { read: true });
    };

    const markAllAsRead = async () => {
        if (!isFirebaseConfigured || demoMode) {
            setNotifications(prev => (prev ?? []).map(n => ({ ...n, read: true })));
            return;
        }
        const batch = writeBatch(db);
        (notifications ?? []).filter(n => !n.read).forEach(n => {
            batch.update(doc(db, 'notifications', n.id), { read: true });
        });
        await batch.commit();
    };

    const addNotification = async (userId: string, title: string, message: string, type: NotificationType, link?: string) => {
        if (!isFirebaseConfigured || demoMode) {
            const newNotif: Notification = {
                id: Math.random().toString(36).slice(2, 11),
                userId,
                title,
                message,
                type,
                link,
                read: false,
                createdAt: new Date()
            };
            setNotifications(prev => [newNotif, ...(prev ?? [])]);
            return;
        }
        await addDoc(collection(db, 'notifications'), {
            userId,
            title,
            message,
            type,
            link,
            read: false,
            createdAt: serverTimestamp()
        });
    };

    return (
        <NotificationContext.Provider value={{
            notifications: visibleNotifications,
            unreadCount,
            loading: Boolean(profile) && !isDemoSession && notifications === null,
            markAsRead,
            markAllAsRead,
            addNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
