'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="text-success" />;
            case 'warning': return <AlertTriangle size={16} className="text-warning" />;
            case 'error': return <XCircle size={16} className="text-danger" />;
            default: return <Info size={16} className="text-info" />;
        }
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button
                className={`bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell size={20} />
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown glass-strong animate-slide-up">
                    <div className="dropdown-header">
                        <h3>Notificações</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={markAllAsRead}>
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notifications">
                                <Bell size={32} />
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                                    onClick={() => !n.read && markAsRead(n.id)}
                                >
                                    <div className="n-icon">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="n-content">
                                        <h4 className="n-title">{n.title}</h4>
                                        <p className="n-message">{n.message}</p>
                                        <div className="n-meta">
                                            <Clock size={10} />
                                            <span>{formatDate(n.createdAt)}</span>
                                        </div>
                                        {n.link && (
                                            <Link href={n.link} className="n-link" onClick={() => setIsOpen(false)}>
                                                Ver detalhes
                                            </Link>
                                        )}
                                    </div>
                                    {!n.read && <div className="unread-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .notification-wrapper {
                    position: relative;
                }

                .bell-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border-primary);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }

                .bell-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                }

                .has-unread {
                    color: var(--accent-primary);
                    border-color: rgba(108, 92, 231, 0.3);
                }

                .unread-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: var(--accent-primary);
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    min-width: 18px;
                    height: 18px;
                    padding: 0 4px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid var(--bg-dashboard);
                }

                .notification-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 12px;
                    width: 360px;
                    max-height: 480px;
                    border-radius: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px var(--border-primary);
                }

                .dropdown-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-primary);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255,255,255,0.02);
                }

                .dropdown-header h3 {
                    font-size: 15px;
                    font-weight: 700;
                }

                .mark-all-btn {
                    background: none;
                    border: none;
                    color: var(--accent-primary);
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 6px;
                }

                .mark-all-btn:hover {
                    background: rgba(108, 92, 231, 0.1);
                }

                .notification-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .empty-notifications {
                    padding: 40px 20px;
                    text-align: center;
                    color: var(--text-muted);
                }

                .empty-notifications p {
                    margin-top: 10px;
                    font-size: 14px;
                }

                .notification-item {
                    padding: 16px 20px;
                    display: flex;
                    gap: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                    position: relative;
                }

                .notification-item:hover {
                    background: rgba(255, 255, 255, 0.03);
                }

                .notification-item.unread {
                    background: rgba(108, 92, 231, 0.03);
                }

                .n-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .n-content {
                    flex: 1;
                    min-width: 0;
                }

                .n-title {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 2px;
                }

                .n-message {
                    font-size: 13px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                    margin-bottom: 8px;
                }

                .n-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .n-link {
                    display: inline-block;
                    margin-top: 8px;
                    font-size: 12px;
                    color: var(--accent-primary);
                    font-weight: 600;
                    text-decoration: none;
                }

                .unread-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--accent-primary);
                    border-radius: 50%;
                    position: absolute;
                    top: 20px;
                    right: 20px;
                }

                @media (max-width: 640px) {
                    .notification-dropdown {
                        position: fixed;
                        top: 60px;
                        left: 10px;
                        right: 10px;
                        width: auto;
                        max-height: calc(100vh - 100px);
                    }
                }
            `}</style>
        </div>
    );
}
