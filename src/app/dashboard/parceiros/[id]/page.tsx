'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Partner, Product, Sale } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
    ArrowLeft,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    FileText,
    TrendingUp,
    Package,
    ShoppingCart,
    BadgeCheck,
    Loader2,
    Calendar,
    ArrowUpRight,
    Search,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function PartnerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { profile, isAdmin, demoMode } = useAuth();
    const { isFirebaseConfigured } = require('@/lib/firebase');

    const [partner, setPartner] = useState<Partner | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'sales'>('products');

    useEffect(() => {
        if (!isAdmin && profile?.partnerId !== id) {
            router.push('/dashboard');
            return;
        }

        async function fetchPartnerData() {
            if (!isFirebaseConfigured || demoMode) {
                // Mock data
                const mockPartner: Partner = {
                    id: id as string,
                    companyName: 'NetLink Telecom Solutions',
                    cnpj: '12.345.678/0001-90',
                    contactName: 'Carlos Oliveira',
                    phone: '(11) 98765-4321',
                    email: 'comercial@netlink.com.br',
                    address: 'Rua das Fibras, 500 - Bloco B, São Paulo/SP',
                    commissionRate: 20,
                    totalProducts: 34,
                    totalSold: 12,
                    totalRevenue: 15700.00,
                    isActive: true,
                    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                };
                setPartner(mockPartner);

                setProducts([
                    { id: 'p1', name: 'ONU Huawei EG8141A5', brand: 'Huawei', model: 'EG', category: 'ONU', condition: 'Usado', serialNumber: 'SN1', price: 150, status: 'disponivel', partnerId: id as string, partnerName: 'NetLink', images: [], createdAt: new Date() } as Product,
                    { id: 'p2', name: 'Switch Cisco 2960', brand: 'Cisco', model: '2960', category: 'Switch', condition: 'Usado', serialNumber: 'SN2', price: 800, status: 'vendido', partnerId: id as string, partnerName: 'NetLink', images: [], createdAt: new Date() } as Product,
                ]);

                setSales([
                    { id: 's1', productId: 'p2', productName: 'Switch Cisco 2960', marketplace: 'Mercado Livre', salePrice: 850, commissionValue: 170, partnerValue: 680, status: 'entregue', saleDate: new Date(), partnerId: id as string, partnerName: 'NetLink' } as Sale
                ]);

                setLoading(false);
                return;
            }

            try {
                // Partner info
                const partnerSnap = await getDoc(doc(db, 'partners', id as string));
                if (partnerSnap.exists()) {
                    setPartner({ id: partnerSnap.id, ...partnerSnap.data() } as Partner);

                    // Products
                    const productsSnap = await getDocs(query(collection(db, 'products'), where('partnerId', '==', id)));
                    setProducts(productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Product[]);

                    const salesSnap = await getDocs(query(collection(db, 'sales'), where('partnerId', '==', id)));
                    const salesData = salesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Sale));
                    setSales(salesData);

                    // Re-calculate statistics based on real data (Ledger logic)
                    const totalSold = salesData.length;
                    const totalRevenue = salesData.reduce((acc, sale) => acc + (sale.partnerValue || 0), 0);
                    const totalProducts = productsSnap.size;

                    setPartner({
                        id: partnerSnap.id,
                        ...partnerSnap.data(),
                        totalSold,
                        totalRevenue,
                        totalProducts
                    } as Partner);
                } else {
                    router.push('/dashboard/parceiros');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        if (profile) fetchPartnerData();
    }, [id, profile, isAdmin, isFirebaseConfigured, demoMode, router]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    if (!partner) return null;

    return (
        <div className="partner-detail-page animate-fade-in">
            {/* Header / Breadcrumb */}
            <div className="breadcrumb">
                <Link href="/dashboard/parceiros" className="back-link">
                    <ArrowLeft size={18} />
                    <span>Voltar para Parceiros</span>
                </Link>
            </div>

            {/* Profile Header */}
            <div className="profile-header glass-strong">
                <div className="profile-main">
                    <div className="partner-avatar">
                        <Building2 size={32} />
                    </div>
                    <div className="partner-title-info">
                        <div className="partner-badge">Parceiro Ativo</div>
                        <h1 className="partner-name">{partner.companyName}</h1>
                        <div className="partner-meta">
                            <span><Calendar size={14} /> Membro desde {formatDate(partner.createdAt)}</span>
                            <span className="dot" />
                            <span><BadgeCheck size={14} style={{ color: 'var(--success)' }} /> Comissionamento: {partner.commissionRate}%</span>
                        </div>
                    </div>
                </div>
                {isAdmin && (
                    <div className="profile-actions">
                        <Link href={`/dashboard/parceiros/${partner.id}/editar`} className="btn-secondary text-sm px-6">
                            Editar Cadastro
                        </Link>
                        <Link href={`/dashboard/produtos/novo?partnerId=${partner.id}`} className="btn-primary text-sm px-6">
                            Novo Produto
                        </Link>
                    </div>
                )}
            </div>

            {/* Metrics */}
            <div className="metrics-grid">
                <div className="metric-card glass-strong">
                    <div className="metric-icon" style={{ color: '#6c5ce7' }}><Package size={20} /></div>
                    <div className="metric-content">
                        <div className="metric-label">Produtos Cadastrados</div>
                        <div className="metric-value">{partner.totalProducts}</div>
                    </div>
                </div>
                <div className="metric-card glass-strong">
                    <div className="metric-icon" style={{ color: '#00cec9' }}><ShoppingCart size={20} /></div>
                    <div className="metric-content">
                        <div className="metric-label">Total de Vendas</div>
                        <div className="metric-value">{partner.totalSold}</div>
                    </div>
                </div>
                <div className="metric-card glass-strong">
                    <div className="metric-icon" style={{ color: '#00b894' }}><TrendingUp size={20} /></div>
                    <div className="metric-content">
                        <div className="metric-label">Lucro Acumulado</div>
                        <div className="metric-value">{formatCurrency(partner.totalRevenue)}</div>
                    </div>
                </div>
            </div>

            <div className="detail-layout">
                {/* Contact Sidebar */}
                <div className="sidebar-info">
                    <div className="info-section-card glass-strong">
                        <h3 className="section-title">Dados de Contato</h3>
                        <div className="contact-list">
                            <div className="contact-item">
                                <User size={16} />
                                <div>
                                    <div className="label">Responsável</div>
                                    <div className="value">{partner.contactName}</div>
                                </div>
                            </div>
                            <div className="contact-item">
                                <Mail size={16} />
                                <div>
                                    <div className="label">E-mail</div>
                                    <div className="value">{partner.email}</div>
                                </div>
                            </div>
                            <div className="contact-item">
                                <Phone size={16} />
                                <div>
                                    <div className="label">Telefone</div>
                                    <div className="value">{partner.phone}</div>
                                </div>
                            </div>
                            <div className="contact-item">
                                <FileText size={16} />
                                <div>
                                    <div className="label">CNPJ</div>
                                    <div className="value">{partner.cnpj}</div>
                                </div>
                            </div>
                            <div className="contact-item">
                                <MapPin size={16} />
                                <div>
                                    <div className="label">Endereço</div>
                                    <div className="value">{partner.address}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Tabs */}
                <div className="main-content">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                            onClick={() => setActiveTab('products')}
                        >
                            Produtos em Consignação ({products.length})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sales')}
                        >
                            Histórico de Vendas ({sales.length})
                        </button>
                    </div>

                    <div className="tab-content card-glow glass-strong">
                        {activeTab === 'products' ? (
                            <div className="table-container-minimal">
                                {products.length === 0 ? (
                                    <div className="empty-mini">Nenhum produto cadastrado.</div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Produto</th>
                                                <th>Serial</th>
                                                <th>Preço</th>
                                                <th>Status</th>
                                                <th>Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand} {p.model}</div>
                                                    </td>
                                                    <td style={{ fontSize: 13 }}>{p.serialNumber}</td>
                                                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                                                    <td>
                                                        <span className={`badge ${getStatusColor(p.status)}`}>
                                                            {getStatusLabel(p.status)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Link href={`/dashboard/produtos/${p.id}`} className="icon-btn">
                                                            <ExternalLink size={14} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ) : (
                            <div className="table-container-minimal">
                                {sales.length === 0 ? (
                                    <div className="empty-mini">Nenhuma venda realizada.</div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Equipamento</th>
                                                <th>Marketplace</th>
                                                <th>Repasse</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ fontSize: 13 }}>{formatDate(s.saleDate)}</td>
                                                    <td style={{ fontWeight: 600 }}>{s.productName}</td>
                                                    <td style={{ fontSize: 13 }}>{s.marketplace}</td>
                                                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                                                        {formatCurrency(s.partnerValue)}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${getStatusColor(s.status)}`}>
                                                            {getStatusLabel(s.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .partner-detail-page { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
                .breadcrumb { margin-bottom: 0px; }
                .back-link { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.2s; }
                .back-link:hover { color: var(--accent-primary); }

                /* Header */
                .profile-header { padding: 40px; border-radius: 32px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
                .profile-main { display: flex; align-items: center; gap: 24px; }
                .partner-avatar { width: 80px; height: 80px; background: var(--accent-primary); color: white; border-radius: 24px; display: flex; align-items: center; justify-content: center; }
                .partner-badge { display: inline-block; padding: 4px 10px; background: rgba(0, 184, 148, 0.1); color: var(--success); border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
                .partner-name { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
                .partner-meta { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--text-secondary); }
                .dot { width: 4px; height: 4px; background: var(--text-muted); border-radius: 50%; }
                .profile-actions { display: flex; gap: 12px; }

                /* Metrics */
                .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .metric-card { padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 16px; }
                .metric-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .metric-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
                .metric-value { font-size: 24px; font-weight: 800; }

                /* Layout Body */
                .detail-layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }
                .sidebar-info { display: flex; flex-direction: column; gap: 24px; }
                .info-section-card { padding: 24px; border-radius: 24px; }
                .section-name { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
                .contact-list { display: flex; flex-direction: column; gap: 20px; }
                .contact-item { display: flex; gap: 16px; color: var(--text-secondary); }
                .contact-item .label { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px; }
                .contact-item .value { font-size: 14px; color: var(--text-primary); font-weight: 500; }

                /* Tabs & Content */
                .tabs-header { display: flex; gap: 8px; margin-bottom: 12px; }
                .tab-btn { padding: 12px 20px; background: transparent; border: none; color: var(--text-muted); font-weight: 600; font-size: 14px; cursor: pointer; border-radius: 12px; transition: all 0.2s; }
                .tab-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.03); }
                .tab-btn.active { color: var(--accent-primary); background: rgba(108, 92, 231, 0.1); }
                
                .tab-content { border-radius: 24px; padding: 24px; min-height: 400px; }
                .table-container-minimal { width: 100%; }
                .empty-mini { text-align: center; color: var(--text-muted); padding: 40px; }

                @media (max-width: 1024px) {
                    .detail-layout { grid-template-columns: 1fr; }
                    .profile-header { flex-direction: column; align-items: flex-start; padding: 30px; }
                    .profile-actions { width: 100%; margin-top: 10px; }
                    .profile-actions button { flex: 1; }
                }
            `}</style>
        </div>
    );
}
