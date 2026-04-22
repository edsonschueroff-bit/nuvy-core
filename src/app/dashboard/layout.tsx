'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Wifi,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2,
  User,
} from 'lucide-react';
import { NotificationProvider } from '@/contexts/NotificationContext';
import Header from '@/components/layout/Header';
import NotificationBell from '@/components/layout/NotificationBell';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Parceiros', href: '/dashboard/parceiros', icon: <Users size={20} />, adminOnly: true },
  { label: 'Produtos', href: '/dashboard/produtos', icon: <Package size={20} /> },
  { label: 'Vendas', href: '/dashboard/vendas', icon: <ShoppingCart size={20} /> },
  { label: 'Financeiro', href: '/dashboard/financeiro', icon: <DollarSign size={20} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, error, signOut, isAdmin, demoMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && !demoMode) {
      router.push('/login');
    }
  }, [user, loading, router, demoMode]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} className="animate-spin mb-4" style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Conectando ao sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '20px'
      }}>
        <div className="glass-strong p-8 rounded-3xl border border-danger/20 text-center max-w-md">
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Erro de Conexão</h2>
          <p className="text-text-secondary text-sm mb-8">
            Não foi possível carregar seu perfil. Isso geralmente acontece se o banco de dados ainda não foi iniciado ou se as regras de acesso estão bloqueadas.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-3"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => signOut()}
              className="text-text-muted hover:text-white transition-colors text-sm"
            >
              Sair e tentar outra conta
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-[10px] text-text-muted font-mono uppercase">Erro: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !demoMode) return null;

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <NotificationProvider>
      <div className="dashboard-layout">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`sidebar glass-strong ${mobileOpen ? 'sidebar-open' : ''}`}>
          {/* Logo */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-img">
                <img src="/logo.png" alt="Nuvy Core" />
              </div>
              <span className="sidebar-logo-text">
                Nuvy <span className="gradient-text">Core</span>
              </span>
            </div>
            <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <div className="sidebar-nav-label">Menu Principal</div>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <button
                  key={item.href}
                  className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
                  onClick={() => {
                    router.push(item.href);
                    setMobileOpen(false);
                  }}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label-text">{item.label}</span>
                  {isActive && <ChevronRight size={16} className="sidebar-nav-arrow" />}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                <User size={18} />
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{profile?.name || 'Usuário'}</span>
                <span className="sidebar-user-role">
                  {isAdmin ? 'Administrador' : 'Parceiro'}
                </span>
              </div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout} title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="dashboard-main">
          <Header />
          {/* Mobile header */}
          <header className="mobile-header glass-strong">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="mobile-logo">
              <img src="/logo.png" alt="Nuvy Core" style={{ height: 20 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Nuvy <span className="gradient-text">Core</span>
              </span>
            </div>
            <div className="mobile-actions">
              <NotificationBell />
            </div>
          </header>

          <div className="dashboard-content page-enter">
            {children}
          </div>
        </main>

        <style jsx>{`
          .dashboard-layout {
            display: flex;
            min-height: 100vh;
            background: var(--bg-primary);
          }

          /* Sidebar */
          .sidebar {
            width: var(--sidebar-width);
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 50;
            display: flex;
            flex-direction: column;
            border-right: 1px solid var(--border-primary);
            transition: transform 0.3s ease;
          }

          .sidebar-header {
            padding: 24px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-subtle);
          }

          .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .sidebar-logo-img {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .sidebar-logo-img img {
            width: 100%;
            height: auto;
            filter: drop-shadow(0 0 10px rgba(108, 92, 231, 0.2));
          }

          .sidebar-logo-text {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }

          .sidebar-close-btn {
            display: none;
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 4px;
          }

          /* Navigation */
          .sidebar-nav {
            flex: 1;
            padding: 20px 12px;
            overflow-y: auto;
          }

          .sidebar-nav-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 0 12px;
            margin-bottom: 12px;
          }

          .sidebar-nav-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 12px;
            border: none;
            background: transparent;
            color: var(--text-secondary);
            font-size: 14px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 4px;
            text-align: left;
          }

          .sidebar-nav-item:hover {
            background: rgba(108, 92, 231, 0.08);
            color: var(--text-primary);
          }

          .sidebar-nav-item-active {
            background: rgba(108, 92, 231, 0.12);
            color: var(--accent-primary);
            font-weight: 600;
          }

          .sidebar-nav-icon {
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }

          .sidebar-nav-label-text {
            flex: 1;
          }

          .sidebar-nav-arrow {
            color: var(--accent-primary);
            opacity: 0.7;
          }

          /* Footer */
          .sidebar-footer {
            padding: 16px 16px;
            border-top: 1px solid var(--border-subtle);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .sidebar-user {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
            min-width: 0;
          }

          .sidebar-user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: var(--bg-elevated);
            border: 1px solid var(--border-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            flex-shrink: 0;
          }

          .sidebar-user-info {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .sidebar-user-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .sidebar-user-role {
            font-size: 11px;
            color: var(--text-muted);
          }

          .sidebar-logout {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            transition: all 0.2s;
          }

          .sidebar-logout:hover {
            background: rgba(255, 107, 107, 0.1);
            color: var(--danger);
          }

          /* Main content */
          .dashboard-main {
            flex: 1;
            margin-left: var(--sidebar-width);
            min-height: 100vh;
          }

          .mobile-header {
            display: none;
            position: sticky;
            top: 0;
            z-index: 40;
            padding: 12px 16px;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-primary);
          }

          .mobile-menu-btn {
            background: none;
            border: none;
            color: var(--text-primary);
            cursor: pointer;
            padding: 8px;
            display: flex;
            align-items: center;
          }

          .mobile-logo {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .mobile-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 45;
            backdrop-filter: blur(4px);
          }

          .dashboard-content {
            padding: 32px;
            max-width: 1400px;
          }

          /* Mobile responsive */
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
              width: 280px;
              background: var(--bg-card); /* Less transparent on mobile */
              box-shadow: 5px 0 25px rgba(0,0,0,0.5);
            }

            .sidebar-open {
              transform: translateX(0);
            }

            .sidebar-close-btn {
              display: flex;
            }

            .mobile-header {
              display: flex;
            }

            .mobile-overlay {
              display: block;
            }

            .dashboard-main {
              margin-left: 0;
            }

            .dashboard-content {
              padding: 20px 16px;
            }
          }
        `}</style>
      </div>
    </NotificationProvider>
  );
}
