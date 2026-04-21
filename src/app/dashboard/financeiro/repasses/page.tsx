'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Wallet,
    ArrowLeft,
    Download,
    CheckCircle,
    Clock,
    FileText,
    Loader2,
    AlertCircle,
    Search,
    ChevronRight,
    DollarSign,
    Building2,
    Calendar
} from 'lucide-react';
import { Partner, Sale, Transfer } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function RepassesPage() {
    const router = useRouter();
    const { isAdmin, demoMode } = useAuth();
    const { addNotification } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [pendingSales, setPendingSales] = useState<Sale[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [demoMode]);

    async function fetchData() {
        setLoading(true);
        try {
            if (demoMode) {
                // Mock Partners
                const mockPartners: Partner[] = [
                    { id: '1', companyName: 'NetLink Telecom', totalRevenue: 15000, totalSold: 12, commissionRate: 20 } as Partner,
                    { id: '2', companyName: 'GigaByte Provedor', totalRevenue: 8500, totalSold: 5, commissionRate: 15 } as Partner
                ];
                setPartners(mockPartners);

                // Mock Pending Sales (delivered but not transferred)
                const mockSales: Sale[] = [
                    { id: 's1', partnerId: '1', partnerName: 'NetLink', productName: 'OLT Huawei', salePrice: 4500, partnerValue: 3600, status: 'entregue', saleDate: new Date() } as Sale,
                    { id: 's2', partnerId: '1', partnerName: 'NetLink', productName: 'Switch Intelbras', salePrice: 1200, partnerValue: 960, status: 'entregue', saleDate: new Date() } as Sale,
                    { id: 's3', partnerId: '2', partnerName: 'GigaByte', productName: 'ONU 10 units', salePrice: 1500, partnerValue: 1275, status: 'entregue', saleDate: new Date() } as Sale,
                ];
                setPendingSales(mockSales);

                // Mock History
                setTransfers([
                    { id: 't1', partnerId: '1', partnerName: 'NetLink Telecom', amount: 5200, status: 'realizado', transferDate: new Date(), createdAt: new Date() } as Transfer,
                    { id: 't2', partnerId: '2', partnerName: 'GigaByte Provedor', amount: 3100, status: 'pendente', createdAt: new Date() } as Transfer,
                ]);
            } else {
                // Real data fetching...
                const partnersSnap = await getDocs(collection(db, 'partners'));
                setPartners(partnersSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Partner));

                const salesQuery = query(collection(db, 'sales'), where('status', '==', 'entregue'));
                const salesSnap = await getDocs(salesQuery);
                const allSales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Sale);
                setPendingSales(allSales.filter(s => !s.transferId));

                const transfersSnap = await getDocs(collection(db, 'transfers'));
                setTransfers(transfersSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Transfer));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateTransfer = async (partnerId: string) => {
        const partnerSales = pendingSales.filter(s => s.partnerId === partnerId);
        const amount = partnerSales.reduce((acc, sale) => acc + sale.partnerValue, 0);
        const partner = partners.find(p => p.id === partnerId);

        if (amount <= 0) return;

        setProcessing(partnerId);
        try {
            if (demoMode) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                await addNotification(
                    'demo-admin',
                    'Repasse Gerado!',
                    `Um novo repasse de ${formatCurrency(amount)} foi gerado para ${partner?.companyName}.`,
                    'success',
                    '/dashboard/financeiro/repasses'
                );
            } else {
                const batch = writeBatch(db);
                const transferRef = doc(collection(db, 'transfers'));

                batch.set(transferRef, {
                    partnerId,
                    partnerName: partner?.companyName,
                    amount,
                    salesIds: partnerSales.map(s => s.id),
                    status: 'pendente',
                    createdAt: serverTimestamp(),
                });

                partnerSales.forEach(sale => {
                    batch.update(doc(db, 'sales', sale.id), {
                        transferId: transferRef.id
                    });
                });

                await batch.commit();
            }
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };

    if (!isAdmin) {
        return <div className="p-8 text-center">Apenas administradores podem gerenciar repasses.</div>;
    }

    return (
        <div className="page animate-fade-in">
            <header className="page-header flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="page-title text-2xl font-bold">Gestão de Repasses</h1>
                    <p className="page-subtitle text-text-secondary text-sm">Controle de pagamentos às empresas parceiras.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna: Aguardando Repasse */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-accent-primary">
                                <Clock size={20} />
                                <h3 className="font-semibold uppercase tracking-wider text-xs">Aguardando Liquidação</h3>
                            </div>
                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded truncate">
                                Vendas status "Entregue"
                            </span>
                        </div>

                        <div className="space-y-4">
                            {partners.map(partner => {
                                const sales = pendingSales.filter(s => s.partnerId === partner.id);
                                const total = sales.reduce((acc, s) => acc + s.partnerValue, 0);
                                if (total === 0) return null;

                                return (
                                    <div key={partner.id} className="item-row flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent-primary/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">{partner.companyName}</h4>
                                                <p className="text-[11px] text-text-muted">{sales.length} vendas pendentes</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
                                            <div>
                                                <p className="text-xs text-text-muted">Valor a Repassar</p>
                                                <p className="font-bold text-accent-secondary">{formatCurrency(total)}</p>
                                            </div>
                                            <button
                                                className="btn-primary py-2 px-4 text-xs"
                                                onClick={() => handleCreateTransfer(partner.id)}
                                                disabled={processing === partner.id}
                                            >
                                                {processing === partner.id ? <Loader2 size={14} className="animate-spin" /> : 'Gerar Repasse'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {!pendingSales.length && !loading && (
                                <div className="text-center py-12 text-text-muted">
                                    <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Todos os repasses estão em dia!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista Detalhada de Vendas Pendentes (Opcional no Accordion/Modal se fosse maior) */}
                </div>

                {/* Coluna: Histórico/Recentes */}
                <div className="space-y-6">
                    <div className="glass-card p-6 h-full">
                        <div className="flex items-center gap-2 mb-6 text-text-secondary">
                            <Calendar size={20} />
                            <h3 className="font-semibold uppercase tracking-wider text-xs">Histórico de Repasses</h3>
                        </div>

                        <div className="space-y-4">
                            {transfers.map(t => (
                                <div key={t.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'realizado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                            {t.status === 'realizado' ? 'Pago' : 'Pendente'}
                                        </span>
                                        <span className="text-[10px] text-text-muted">
                                            {t.createdAt.toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h5 className="font-bold text-sm truncate">{t.partnerName}</h5>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-lg font-black text-accent-secondary">{formatCurrency(t.amount)}</span>
                                        <ChevronRight size={16} className="text-text-muted group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                }
                .item-row {
                    animation: slideRight 0.3s ease-out forwards;
                }
                @keyframes slideRight {
                    from { transform: translateX(-10px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
