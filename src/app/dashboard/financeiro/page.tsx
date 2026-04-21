'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
    DollarSign, TrendingUp, ArrowUpRight, Wallet, Clock, CheckCircle2,
    Loader2, AlertCircle, CheckCircle, Plus, X, Users,
} from 'lucide-react';

interface FinancialSummary {
    totalRevenue: number;
    totalCommission: number;
    totalPartnerPayments: number;
    pendingTransfers: number;
    completedTransfers: number;
}

interface TransferData {
    id: string;
    partnerId: string;
    partnerName: string;
    amount: number;
    salesIds: string[];
    status: string;
    transferDate?: Date;
    createdAt: Date;
}

interface PendingPartner {
    partnerId: string;
    partnerName: string;
    totalPending: number;
    salesCount: number;
    salesIds: string[];
}

export default function FinanceiroPage() {
    const router = useRouter();
    const { profile, isAdmin, demoMode } = useAuth();
    const { isFirebaseConfigured } = require('@/lib/firebase');
    const [summary, setSummary] = useState<FinancialSummary>({
        totalRevenue: 0, totalCommission: 0, totalPartnerPayments: 0, pendingTransfers: 0, completedTransfers: 0,
    });
    const [transfers, setTransfers] = useState<TransferData[]>([]);
    const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<PendingPartner | null>(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [profile, isAdmin, demoMode]);

    async function fetchData() {
        if (!isFirebaseConfigured || demoMode) {
            // Mock data for demo mode to prevent infinite loading
            setSummary({
                totalRevenue: 15400,
                totalCommission: 3080,
                totalPartnerPayments: 12320,
                pendingTransfers: 4500,
                completedTransfers: 7820
            });

            if (isAdmin) {
                setPendingPartners([
                    { partnerId: '1', partnerName: 'NetLink Telecom', totalPending: 2500, salesCount: 3, salesIds: ['a', 'b', 'c'] },
                    { partnerId: '2', partnerName: 'FiberFast Internet', totalPending: 2000, salesCount: 2, salesIds: ['d', 'e'] }
                ]);
            }

            setTransfers([
                { id: '1', partnerId: '1', partnerName: 'NetLink Telecom', amount: 3500, salesIds: [], status: 'realizado', transferDate: new Date(), createdAt: new Date() },
                { id: '2', partnerId: '2', partnerName: 'FiberFast Internet', amount: 4320, salesIds: [], status: 'realizado', transferDate: new Date(Date.now() - 86400000), createdAt: new Date(Date.now() - 86400000) }
            ]);

            setLoading(false);
            return;
        }

        try {
            // Sales data
            let salesQuery = query(collection(db, 'sales'));
            if (!isAdmin && profile?.partnerId) {
                salesQuery = query(collection(db, 'sales'), where('partnerId', '==', profile.partnerId));
            }
            const salesSnap = await getDocs(salesQuery);

            let totalRevenue = 0;
            let totalCommission = 0;
            let totalPartnerPayments = 0;
            const pendingByPartner: Record<string, PendingPartner> = {};

            salesSnap.docs.forEach(d => {
                const data = d.data();
                totalRevenue += data.salePrice || 0;
                totalCommission += data.commissionValue || 0;
                totalPartnerPayments += data.partnerValue || 0;

                // Track pending payments (sales that are "entregue" but not yet transferred)
                if (data.status === 'entregue') {
                    const pid = data.partnerId;
                    if (!pendingByPartner[pid]) {
                        pendingByPartner[pid] = {
                            partnerId: pid,
                            partnerName: data.partnerName,
                            totalPending: 0,
                            salesCount: 0,
                            salesIds: [],
                        };
                    }
                    pendingByPartner[pid].totalPending += data.partnerValue || 0;
                    pendingByPartner[pid].salesCount += 1;
                    pendingByPartner[pid].salesIds.push(d.id);
                }
            });

            setPendingPartners(Object.values(pendingByPartner));

            // Transfers
            let transfersQuery = query(collection(db, 'transfers'));
            if (!isAdmin && profile?.partnerId) {
                transfersQuery = query(collection(db, 'transfers'), where('partnerId', '==', profile.partnerId));
            }
            const transfersSnap = await getDocs(transfersQuery);

            let pendingTransfers = 0;
            let completedTransfers = 0;
            const transfersData = transfersSnap.docs.map(d => {
                const data = d.data();
                if (data.status === 'pendente') pendingTransfers += data.amount || 0;
                else completedTransfers += data.amount || 0;
                return {
                    id: d.id,
                    ...data,
                    transferDate: data.transferDate?.toDate?.(),
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                };
            }) as TransferData[];

            setSummary({ totalRevenue, totalCommission, totalPartnerPayments, pendingTransfers, completedTransfers });
            setTransfers(transfersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function createTransfer(partner: PendingPartner) {
        setSaving(true);
        try {
            await addDoc(collection(db, 'transfers'), {
                partnerId: partner.partnerId,
                partnerName: partner.partnerName,
                amount: partner.totalPending,
                salesIds: partner.salesIds,
                status: 'pendente',
                createdAt: serverTimestamp(),
            });
            setSuccess(`Repasse de ${formatCurrency(partner.totalPending)} criado para ${partner.partnerName}!`);
            await fetchData();
            setTimeout(() => { setShowTransferModal(false); setSuccess(''); }, 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function markTransferDone(id: string) {
        try {
            await updateDoc(doc(db, 'transfers', id), {
                status: 'realizado',
                transferDate: serverTimestamp(),
            });
            await fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            <div className="page-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Financeiro</h1>
                        <p className="page-subtitle">{isAdmin ? 'Visão geral financeira' : 'Meus recebimentos'}</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => router.push('/dashboard/financeiro/repasses')}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Wallet size={18} />
                            Gestão de Repasses
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="finance-kpis">
                <div className="kpi-card">
                    <div className="kpi-icon-wrap" style={{ background: 'rgba(0, 184, 148, 0.12)', color: '#00b894' }}>
                        <DollarSign size={22} />
                    </div>
                    <div className="kpi-value">{formatCurrency(summary.totalRevenue)}</div>
                    <div className="kpi-label">Receita Total</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-wrap" style={{ background: 'rgba(108, 92, 231, 0.12)', color: '#6c5ce7' }}>
                        <TrendingUp size={22} />
                    </div>
                    <div className="kpi-value">{formatCurrency(isAdmin ? summary.totalCommission : summary.totalPartnerPayments)}</div>
                    <div className="kpi-label">{isAdmin ? 'Minhas Comissões' : 'Meu Faturamento'}</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-wrap" style={{ background: 'rgba(253, 203, 110, 0.12)', color: '#fdcb6e' }}>
                        <Clock size={22} />
                    </div>
                    <div className="kpi-value">{formatCurrency(summary.pendingTransfers)}</div>
                    <div className="kpi-label">Repasses Pendentes</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-wrap" style={{ background: 'rgba(0, 206, 201, 0.12)', color: '#00cec9' }}>
                        <CheckCircle2 size={22} />
                    </div>
                    <div className="kpi-value">{formatCurrency(summary.completedTransfers)}</div>
                    <div className="kpi-label">Repasses Realizados</div>
                </div>
            </div>

            {/* Pending transfers - Admin only */}
            {isAdmin ? (
                pendingPartners.length > 0 && (
                    <div className="section">
                        <h2 className="section-title">Parceiros com Repasse Pendente</h2>
                        <div className="pending-grid">
                            {pendingPartners.map((pp) => (
                                <div key={pp.partnerId} className="card pending-card">
                                    <div className="pending-info">
                                        <div className="pending-avatar"><Users size={18} /></div>
                                        <div>
                                            <h4>{pp.partnerName}</h4>
                                            <p>{pp.salesCount} venda{pp.salesCount > 1 ? 's' : ''} entregue{pp.salesCount > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="pending-amount">{formatCurrency(pp.totalPending)}</div>
                                    <button className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => createTransfer(pp)}>
                                        Criar Repasse
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            ) : (
                <div className="section">
                    <div className="glass-card p-6 border-l-4 border-warning">
                        <div className="flex items-center gap-3">
                            <Clock className="text-warning" size={24} />
                            <div>
                                <h3 className="font-bold text-sm">Informativo de Recebíveis</h3>
                                <p className="text-xs text-text-muted mt-1">
                                    Seus repasses são gerados automaticamente assim que as vendas atingem o status "Entregue".
                                    O prazo para a liberação financeira é de até 2 dias úteis após a entrega confirmada.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfers history */}
            <div className="section">
                <h2 className="section-title">Histórico de Repasses</h2>
                {transfers.length === 0 ? (
                    <div className="empty-state">
                        <Wallet size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                        <h3>Nenhum repasse registrado</h3>
                        <p>Os repasses criados aparecerão aqui</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Parceiro</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                    {isAdmin && <th>Ação</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map((t) => (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 600 }}>{t.partnerName}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(t.amount)}</td>
                                        <td>
                                            <span className={`badge ${getStatusColor(t.status)}`}>{getStatusLabel(t.status)}</span>
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                            {t.transferDate ? formatDate(t.transferDate) : '—'}
                                        </td>
                                        {isAdmin && (
                                            <td>
                                                {t.status === 'pendente' && (
                                                    <button
                                                        className="btn-primary"
                                                        style={{ fontSize: 12, padding: '6px 12px' }}
                                                        onClick={() => markTransferDone(t.id)}
                                                    >
                                                        <CheckCircle size={14} />
                                                        Confirmar
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .page-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
        .page-subtitle { font-size: 14px; color: var(--text-secondary); }
        .finance-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .kpi-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .kpi-value { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
        .kpi-label { font-size: 13px; color: var(--text-secondary); }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
        .pending-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .pending-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
        .pending-info { display: flex; align-items: center; gap: 12px; flex: 1; }
        .pending-avatar { width: 40px; height: 40px; border-radius: 12px; background: rgba(108, 92, 231, 0.1); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; }
        .pending-info h4 { font-size: 14px; font-weight: 600; }
        .pending-info p { font-size: 12px; color: var(--text-muted); }
        .pending-amount { font-size: 18px; font-weight: 800; color: var(--success); }
        .empty-state { text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px; }
        .empty-state h3 { font-size: 16px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary); }
        .empty-state p { font-size: 13px; color: var(--text-muted); }
        @media (max-width: 1024px) { .finance-kpis { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .finance-kpis { grid-template-columns: 1fr; } .pending-card { flex-direction: column; align-items: stretch; text-align: center; } }
      `}</style>
        </div>
    );
}
