'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Package,
    ShoppingCart,
    DollarSign,
    Users,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Loader2,
} from 'lucide-react';

interface DashboardStats {
    totalProducts: number;
    totalSales: number;
    totalRevenue: number;
    totalPartners: number;
    productsAvailable: number;
    pendingTransfers: number;
    totalCommission: number;
    recentSales: Array<{
        id: string;
        productName: string;
        marketplace: string;
        salePrice: number;
        status: string;
        saleDate: Date;
    }>;
    chartData: Array<{ name: string; revenue: number; commission: number }>;
    marketplaceData: Array<{ name: string; value: number }>;
    turnoverRate: number;
    maintenanceCount: number;
}

const COLORS = ['#6c5ce7', '#00cec9', '#fd79a8', '#fdcb6e', '#00b894', '#74b9ff'];

export default function DashboardPage() {
    const { profile, isAdmin, demoMode } = useAuth();
    const { isFirebaseConfigured } = require('@/lib/firebase');
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalPartners: 0,
        productsAvailable: 0,
        pendingTransfers: 0,
        totalCommission: 0,
        recentSales: [],
        chartData: [],
        marketplaceData: [],
        turnoverRate: 0,
        maintenanceCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            if (!isFirebaseConfigured || demoMode) {
                setStats({
                    totalProducts: isAdmin ? 120 : 45,
                    totalSales: isAdmin ? 84 : 32,
                    totalRevenue: isAdmin ? 42500 : 15400,
                    totalPartners: isAdmin ? 5 : 0,
                    productsAvailable: isAdmin ? 36 : 13,
                    pendingTransfers: isAdmin ? 12500 : 4500, // Total pendente vs Saldo do parceiro
                    totalCommission: isAdmin ? 8500 : 0,
                    recentSales: [
                        { id: '1', productName: 'ONU Huawei EG8141A5', marketplace: 'Mercado Livre', salePrice: 150, status: 'entregue', saleDate: new Date() },
                        { id: '2', productName: 'OLT Datacom DM4610', marketplace: 'Venda Direta', salePrice: 8500, status: 'enviado', saleDate: new Date(Date.now() - 86400000) },
                        { id: '3', productName: 'Switch Intelbras L2', marketplace: 'Shopee', salePrice: 450, status: 'pendente', saleDate: new Date(Date.now() - 172800000) },
                    ],
                    chartData: [
                        { name: 'Jan', revenue: 4000, commission: 800 },
                        { name: 'Fev', revenue: 3000, commission: 600 },
                        { name: 'Mar', revenue: 9000, commission: 1800 },
                        { name: 'Abr', revenue: 12000, commission: 2400 },
                        { name: 'Mai', revenue: 15400, commission: 3080 },
                    ],
                    marketplaceData: [
                        { name: 'Mercado Livre', value: 45 },
                        { name: 'Shopee', value: 25 },
                        { name: 'Amazon', value: 15 },
                        { name: 'Venda Direta', value: 15 },
                    ],
                    turnoverRate: 70,
                    maintenanceCount: 4,
                });
                setLoading(false);
                return;
            }

            try {
                // Real data fetching logic here (omitted for brevity but would follow same pattern)
                // In a real app, you'd aggregate sales by month and marketplace
                // For now, let's keep the real fetching basic but with mock charts until aggregation is built

                // Products
                let productsQuery = query(collection(db, 'products'));
                if (!isAdmin && profile?.partnerId) {
                    productsQuery = query(collection(db, 'products'), where('partnerId', '==', profile.partnerId));
                }
                const productsSnap = await getDocs(productsQuery);
                const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                const totalProducts = productsData.length;
                const productsAvailable = productsData.filter(p => p.status === 'disponivel' || p.status === 'anunciado').length;

                // Sales
                let salesQuery = query(collection(db, 'sales'));
                if (!isAdmin && profile?.partnerId) {
                    salesQuery = query(collection(db, 'sales'), where('partnerId', '==', profile.partnerId));
                }
                const salesSnap = await getDocs(salesQuery);
                const totalSales = salesSnap.size;
                let totalRevenue = 0;
                let totalCommission = 0;

                const marketplaces: Record<string, number> = {};

                salesSnap.docs.forEach(d => {
                    const data = d.data();
                    totalRevenue += data.salePrice || 0;
                    totalCommission += data.commissionValue || 0;

                    const m = data.marketplace || 'Outros';
                    marketplaces[m] = (marketplaces[m] || 0) + 1;
                });

                const marketplaceData = Object.entries(marketplaces).map(([name, value]) => ({ name, value }));

                // Recent sales
                const recentSales = salesSnap.docs
                    .map(d => ({
                        id: d.id,
                        productName: d.data().productName,
                        marketplace: d.data().marketplace,
                        salePrice: d.data().salePrice,
                        status: d.data().status,
                        saleDate: d.data().saleDate?.toDate?.() || new Date(),
                    }))
                    .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())
                    .slice(0, 5);

                // Partners (admin only)
                let totalPartners = 0;
                if (isAdmin) {
                    const partnersSnap = await getDocs(collection(db, 'partners'));
                    totalPartners = partnersSnap.size;
                }

                // Transfers
                let pendingTransfers = 0;
                let transfersQuery = query(collection(db, 'transfers'), where('status', '==', 'pendente'));
                if (!isAdmin && profile?.partnerId) {
                    transfersQuery = query(
                        collection(db, 'transfers'),
                        where('partnerId', '==', profile.partnerId),
                        where('status', '==', 'pendente')
                    );
                }
                const transfersSnap = await getDocs(transfersQuery);
                transfersSnap.docs.forEach(d => {
                    pendingTransfers += d.data().amount || 0;
                });

                const turnoverRate = totalProducts > 0 ? (totalSales / totalProducts) * 100 : 0;
                const maintenanceCount = productsData.filter(p => p.status === 'manutencao').length;

                setStats({
                    totalProducts,
                    totalSales,
                    totalRevenue,
                    totalPartners,
                    productsAvailable,
                    pendingTransfers,
                    totalCommission,
                    recentSales,
                    turnoverRate,
                    maintenanceCount,
                    chartData: [
                        { name: 'Jan', revenue: totalRevenue * 0.2, commission: totalCommission * 0.2 },
                        { name: 'Fev', revenue: totalRevenue * 0.4, commission: totalCommission * 0.4 },
                        { name: 'Mar', revenue: totalRevenue, commission: totalCommission },
                    ],
                    marketplaceData: marketplaceData.length > 0 ? marketplaceData : [{ name: 'Sem dados', value: 1 }],
                });
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            } finally {
                setLoading(false);
            }
        }

        if (profile) fetchStats();
    }, [profile, isAdmin, demoMode]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div className="dashboard-page scale-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <div className="welcome-badge">
                        <TrendingUp size={12} />
                        <span>Resumo de Performance</span>
                    </div>
                    <h1 className="page-title">
                        {isAdmin ? 'Dashboard Geral' : 'Meu Painel'}
                    </h1>
                    <p className="page-subtitle">
                        Olá, <strong>{profile?.name}</strong>! Veja como estão os seus negócios hoje.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card card-glow">
                    <div className="kpi-header">
                        <div className="kpi-icon" style={{ background: 'rgba(108, 92, 231, 0.12)', color: '#6c5ce7' }}>
                            <Package size={22} />
                        </div>
                        <div className="kpi-trend kpi-trend-up">
                            <ArrowUpRight size={14} />
                            <span>12%</span>
                        </div>
                    </div>
                    <div className="kpi-value">{stats.totalProducts}</div>
                    <div className="kpi-label">Equipamentos</div>
                    <div className="kpi-sub">{stats.productsAvailable} disponíveis para venda</div>
                </div>

                <div className="kpi-card card-glow">
                    <div className="kpi-header">
                        <div className="kpi-icon" style={{ background: 'rgba(0, 206, 201, 0.12)', color: '#00cec9' }}>
                            <ShoppingCart size={22} />
                        </div>
                        <div className="kpi-trend kpi-trend-up">
                            <ArrowUpRight size={14} />
                            <span>8%</span>
                        </div>
                    </div>
                    <div className="kpi-value">{stats.totalSales}</div>
                    <div className="kpi-label">Vendas Realizadas</div>
                    <div className="kpi-sub">Total acumulado</div>
                </div>

                <div className="kpi-card card-glow accent-card">
                    <div className="kpi-header">
                        <div className="kpi-icon" style={{ background: 'rgba(0, 184, 148, 0.12)', color: '#00b894' }}>
                            <DollarSign size={22} />
                        </div>
                        <div className="kpi-trend kpi-trend-up">
                            <TrendingUp size={14} />
                            <span>24%</span>
                        </div>
                    </div>
                    <div className="kpi-value">{formatCurrency(isAdmin ? stats.totalCommission : stats.totalRevenue - stats.totalCommission)}</div>
                    <div className="kpi-label">{isAdmin ? 'Comissão Nuvy Core' : 'Meu Lucro Líquido'}</div>
                    <div className="kpi-sub">
                        {isAdmin
                            ? `Receita Bruta: ${formatCurrency(stats.totalRevenue)}`
                            : `Total Bruto: ${formatCurrency(stats.totalRevenue)}`
                        }
                    </div>
                </div>

                {isAdmin ? (
                    <div className="kpi-card card-glow">
                        <div className="kpi-header">
                            <div className="kpi-icon" style={{ background: 'rgba(253, 121, 168, 0.12)', color: '#fd79a8' }}>
                                <Users size={22} />
                            </div>
                        </div>
                        <div className="kpi-value">{stats.totalPartners}</div>
                        <div className="kpi-label">Parceiros Ativos</div>
                        <div className="kpi-sub">Provedores cadastrados</div>
                    </div>
                ) : (
                    <div className="kpi-card card-glow">
                        <div className="kpi-header">
                            <div className="kpi-icon" style={{ background: 'rgba(253, 203, 110, 0.12)', color: '#fdcb6e' }}>
                                <Clock size={22} />
                            </div>
                        </div>
                        <div className="kpi-value">{formatCurrency(stats.pendingTransfers)}</div>
                        <div className="kpi-label">Repasse Pendente</div>
                        <div className="kpi-sub">Aguardando liberação</div>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                <div className="chart-container glass-strong">
                    <div className="chart-header">
                        <h3 className="chart-title">Desempenho Financeiro</h3>
                        <p className="chart-subtitle">Receita e comissão nos últimos meses</p>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCom" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00cec9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00cec9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    tickFormatter={(value) => `R$ ${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: '12px',
                                        color: 'var(--text-primary)'
                                    }}
                                    itemStyle={{ fontSize: '13px' }}
                                />
                                <Area type="monotone" dataKey="revenue" name="Receita" stroke="#6c5ce7" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="commission" name="Comissão" stroke="#00cec9" strokeWidth={3} fillOpacity={1} fill="url(#colorCom)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container glass-strong">
                    <div className="chart-header">
                        <h3 className="chart-title">Canais de Venda</h3>
                        <p className="chart-subtitle">Distribuição por marketplace</p>
                    </div>
                    <div className="chart-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.marketplaceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.marketplaceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: '12px'
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Sales */}
            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Vendas Recentes</h2>
                    <button className="text-btn">Ver todas</button>
                </div>
                {stats.recentSales.length === 0 ? (
                    <div className="empty-state">
                        <ShoppingCart size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                        <h3>Nenhuma venda encontrada</h3>
                        <p>As vendas aparecerão aqui assim que forem registradas</p>
                    </div>
                ) : (
                    <div className="table-container card-glow">
                        <table>
                            <thead>
                                <tr>
                                    <th>Equipamento</th>
                                    <th>Canais</th>
                                    <th>Valor de Venda</th>
                                    <th>Status Atual</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentSales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{sale.productName}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {sale.id.slice(0, 8)}</div>
                                        </td>
                                        <td>
                                            <span className="marketplace-tag">{sale.marketplace}</span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                                            {formatCurrency(sale.salePrice)}
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusColor(sale.status)}`}>
                                                {getStatusLabel(sale.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
                .dashboard-page {
                    animation: pageIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes pageIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }

                .welcome-badge {
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  background: rgba(108, 92, 231, 0.1);
                  color: var(--accent-primary);
                  padding: 4px 10px;
                  border-radius: 20px;
                  font-size: 11px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 12px;
                }

                .page-header {
                    margin-bottom: 32px;
                }

                .page-title {
                    font-size: 32px;
                    font-weight: 900;
                    letter-spacing: -1px;
                    margin-bottom: 8px;
                }

                .page-subtitle {
                    font-size: 15px;
                    color: var(--text-secondary);
                }

                .page-subtitle strong {
                    color: var(--text-primary);
                }

                /* KPI Grid */
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .kpi-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-primary);
                    border-radius: 24px;
                    padding: 24px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .card-glow:hover {
                    border-color: rgba(108, 92, 231, 0.4);
                    box-shadow: 0 10px 30px -10px rgba(108, 92, 231, 0.2);
                    transform: translateY(-4px);
                }

                .accent-card {
                  background: linear-gradient(145deg, var(--bg-card), #1a1a2e);
                  border-color: rgba(108, 92, 231, 0.2);
                }

                .kpi-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }

                .kpi-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .kpi-trend {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 8px;
                }

                .kpi-trend-up {
                    background: rgba(0, 184, 148, 0.1);
                    color: var(--success);
                }

                .kpi-value {
                    font-size: 36px;
                    font-weight: 900;
                    letter-spacing: -1.5px;
                    line-height: 1;
                    margin-bottom: 8px;
                }

                .kpi-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                }

                .kpi-sub {
                    font-size: 12px;
                    color: var(--text-muted);
                }

                /* Charts Section */
                .charts-grid {
                  display: grid;
                  grid-template-columns: 2fr 1fr;
                  gap: 20px;
                  margin-bottom: 32px;
                }

                .chart-container {
                  padding: 28px;
                  border-radius: 24px;
                  border: 1px solid var(--border-primary);
                }

                .chart-header {
                  margin-bottom: 24px;
                }

                .chart-title {
                  font-size: 18px;
                  font-weight: 700;
                  margin-bottom: 4px;
                }

                .chart-subtitle {
                  font-size: 13px;
                  color: var(--text-muted);
                }

                .chart-wrapper {
                  width: 100%;
                }

                /* Section */
                .section {
                    margin-bottom: 32px;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }

                .section-title {
                    font-size: 20px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }

                .text-btn {
                  background: none;
                  border: none;
                  color: var(--accent-primary);
                  font-size: 14px;
                  font-weight: 600;
                  cursor: pointer;
                  padding: 4px 8px;
                  border-radius: 6px;
                  transition: background 0.2s;
                }

                .text-btn:hover {
                  background: rgba(108, 92, 231, 0.1);
                }

                .marketplace-tag {
                  padding: 4px 10px;
                  background: var(--bg-elevated);
                  border: 1px solid var(--border-primary);
                  border-radius: 8px;
                  font-size: 12px;
                  font-weight: 500;
                  color: var(--text-secondary);
                }

                /* Mobile responsive */
                @media (max-width: 1200px) {
                  .charts-grid {
                    grid-template-columns: 1fr;
                  }
                }

                @media (max-width: 1024px) {
                    .kpi-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 640px) {
                    .kpi-grid {
                        grid-template-columns: 1fr;
                    }
                    .page-title { font-size: 26px; }
                    .kpi-value { font-size: 30px; }
                }
            `}</style>
        </div>
    );
}
