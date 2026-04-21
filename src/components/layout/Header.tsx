'use client';

import NotificationBell from './NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Search } from 'lucide-react';

export default function Header() {
    const { profile } = useAuth();

    return (
        <header className="desktop-header glass-strong">
            <div className="header-search">
                <Search size={18} />
                <input type="text" placeholder="Pesquisar no sistema..." />
            </div>

            <div className="header-actions">
                <NotificationBell />
                <div className="header-divider" />
                <div className="header-user-status">
                    <span className="status-dot-active" />
                    <span className="status-text">Online</span>
                </div>
            </div>

            <style jsx>{`
                .desktop-header {
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 32px;
                    border-bottom: 1px solid var(--border-primary);
                    position: sticky;
                    top: 0;
                    z-index: 30;
                }

                .header-search {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border-primary);
                    padding: 8px 16px;
                    border-radius: 12px;
                    width: 300px;
                    color: var(--text-muted);
                }

                .header-search input {
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    font-size: 14px;
                    outline: none;
                    width: 100%;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .header-divider {
                    width: 1px;
                    height: 24px;
                    background: var(--border-primary);
                }

                .header-user-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0, 184, 148, 0.08);
                    padding: 6px 12px;
                    border-radius: 20px;
                }

                .status-dot-active {
                    width: 8px;
                    height: 8px;
                    background: var(--success);
                    border-radius: 50%;
                    box-shadow: 0 0 8px var(--success);
                }

                .status-text {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--success);
                }

                @media (max-width: 768px) {
                    .desktop-header {
                        display: none;
                    }
                }
            `}</style>
        </header>
    );
}
