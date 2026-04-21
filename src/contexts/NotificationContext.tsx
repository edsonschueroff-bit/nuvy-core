'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { profile, demoMode } = useAuth();
    const { isFirebaseConfigured } = require('@/lib/firebase');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!profile) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        if (!isFirebaseConfigured || demoMode) {
            // Mock notifications for demo
            setNotifications([
                {
                    id: '1',
                    userId: profile.uid,
                    title: 'Bem-vindo ao Nuvy Core!',
                    message: 'Esta é uma notificação de demonstração de sua nova plataforma de ativos.',
                    type: 'success',
                    read: false,
                    createdAt: new Date()
                },
                {
                    id: '2',
                    userId: profile.uid,
                    title: 'Repasse Disponível',
                    message: 'Você tem um novo repasse pendente de R$ 4.500,00.',
                    type: 'info',
                    link: '/dashboard/financeiro',
                    read: false,
                    createdAt: new Date(Date.now() - 3600000)
                }
            ]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', profile.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            })) as Notification[];
            setNotifications(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [profile, demoMode, isFirebaseConfigured]);

    const markAsRead = async (id: string) => {
        if (!isFirebaseConfigured || demoMode) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            return;
        }
        await updateDoc(doc(db, 'notifications', id), { read: true });
    };

    const markAllAsRead = async () => {
        if (!isFirebaseConfigured || demoMode) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            return;
        }
        const batch = writeBatch(db);
        notifications.filter(n => !n.read).forEach(n => {
            batch.update(doc(db, 'notifications', n.id), { read: true });
        });
        await batch.commit();
    };

    const addNotification = async (userId: string, title: string, message: string, type: NotificationType, link?: string) => {
        if (!isFirebaseConfigured || demoMode) {
            const newNotif: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                userId,
                title,
                message,
                type,
                link,
                read: false,
                createdAt: new Date()
            };
            setNotifications(prev => [newNotif, ...prev]);
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
            notifications,
            unreadCount,
            loading,
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
