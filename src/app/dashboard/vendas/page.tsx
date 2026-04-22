'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    collection,
    doc,
    getDocs,
    increment,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Product, Sale } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
    ShoppingCart, Plus, Search, X, Loader2, AlertCircle, CheckCircle,
} from 'lucide-react';

const marketplaces = ['Mercado Livre', 'Shopee', 'Amazon', 'OLX', 'Facebook Marketplace', 'Outros'];

interface SaleFormData {
    productId: string;
    marketplace: string;
    salePrice: number;
    buyerName: string;
}

export default function VendasPage() {
    const { profile, isAdmin, demoMode } = useAuth();
    const { addNotification } = useNotifications();
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<SaleFormData>({ productId: '', marketplace: 'Mercado Livre', salePrice: 0, buyerName: '' });
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [profile, isAdmin, demoMode]);

    async function fetchData() {
        if (!isFirebaseConfigured || demoMode) {
            setSales([
                { id: '1', productId: 'p1', productName: 'ONU Huawei EG8141A5', partnerId: '1', partnerName: 'NetLink Telecom', marketplace: 'Mercado Livre', salePrice: 150, commissionRate: 20, commissionValue: 30, partnerValue: 120, buyerName: 'João Cliente', status: 'entregue', saleDate: new Date(), createdAt: new Date() },
                { id: '2', productId: 'p2', productName: 'OLT Datacom DM4610', partnerId: '1', partnerName: 'NetLink Telecom', marketplace: 'Venda Direta', salePrice: 8500, commissionRate: 20, commissionValue: 1700, partnerValue: 6800, buyerName: 'Telecom XYZ', status: 'enviado', saleDate: new Date(Date.now() - 86400000), createdAt: new Date(Date.now() - 86400000) }
            ]);
            setProducts([
                { id: 'p3', partnerId: '1', partnerName: 'NetLink Telecom', name: 'Switch Intelbras L2', brand: 'Intelbras', model: 'SG 2404 MR', category: 'Switch', condition: 'Usado', price: 450, status: 'disponivel', quantity: 3, description: '', createdAt: new Date() } as Product
            ]);
            setLoading(false);
            return;
        }

        try {
            let salesQuery = query(collection(db, 'sales'));
            if (!isAdmin && profile?.partnerId) {
                salesQuery = query(collection(db, 'sales'), where('partnerId', '==', profile.partnerId));
            }
            const salesSnap = await getDocs(salesQuery);
            const salesData = salesSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                saleDate: d.data().saleDate?.toDate?.() || new Date(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
            })) as Sale[];
            setSales(salesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

            let productsQuery = query(collection(db, 'products'), where('status', 'in', ['disponivel', 'anunciado']));
            if (!isAdmin && profile?.partnerId) {
                productsQuery = query(
                    collection(db, 'products'),
                    where('partnerId', '==', profile.partnerId),
                    where('status', 'in', ['disponivel', 'anunciado'])
                );
            }
            const productsSnap = await getDocs(productsQuery);
            setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
        } catch (fetchError) {
            console.error(fetchError);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const product = products.find(p => p.id === form.productId);
            if (!product) {
                setError('Produto não encontrado');
                setSaving(false);
                return;
            }

            if (!isFirebaseConfigured || demoMode) {
                const newSale: Sale = {
                    id: Math.random().toString(36).slice(2, 11),
                    productId: product.id,
                    productName: product.name,
                    partnerId: product.partnerId,
                    partnerName: product.partnerName,
                    marketplace: form.marketplace,
                    salePrice: form.salePrice,
                    commissionRate: 20,
                    commissionValue: form.salePrice * 0.2,
                    partnerValue: form.salePrice * 0.8,
                    buyerName: form.buyerName,
                    status: 'pendente',
                    saleDate: new Date(),
                    createdAt: new Date()
                };

                setSales(prev => [newSale, ...prev]);

                const currentQty = product.quantity || 1;
                if (currentQty <= 1) {
                    setProducts(prev => prev.filter(p => p.id !== product.id));
                } else {
                    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: currentQty - 1 } : p));
                }

                await addNotification(
                    profile?.uid || 'demo-admin',
                    'Nova Venda Registrada!',
                    `O produto ${product.name} foi vendido no ${form.marketplace} por ${formatCurrency(form.salePrice)}.`,
                    'success',
                    '/dashboard/vendas'
                );

                setSuccess('Venda registrada com sucesso! (Modo Demo)');
                setTimeout(() => { setShowModal(false); setSuccess(''); }, 1500);
                setSaving(false);
                return;
            }

            const saleRef = doc(collection(db, 'sales'));
            const transactionRef = doc(collection(db, 'transactions'));
            const logRef = doc(collection(db, 'logs'));
            const productRef = doc(db, 'products', product.id);
            const partnerRef = doc(db, 'partners', product.partnerId);

            await runTransaction(db, async (transaction) => {
                const productSnap = await transaction.get(productRef);
                if (!productSnap.exists()) {
                    throw new Error('Produto não encontrado.');
                }

                const productData = productSnap.data();
                const currentStatus = productData.status;
                if (currentStatus !== 'disponivel' && currentStatus !== 'anunciado') {
                    throw new Error('Este produto não está mais disponível para venda.');
                }

                const currentQuantity = Number(productData.quantity || 1);
                if (currentQuantity <= 0) {
                    throw new Error('Estoque esgotado para este produto.');
                }

                const partnerSnap = await transaction.get(partnerRef);
                const commissionRate = Number(partnerSnap.data()?.commissionRate ?? 20);
                const commissionValue = form.salePrice * (commissionRate / 100);
                const partnerValue = form.salePrice - commissionValue;
                const newQuantity = currentQuantity - 1;

                transaction.set(saleRef, {
                    productId: product.id,
                    productName: product.name,
                    partnerId: product.partnerId,
                    partnerName: product.partnerName,
                    marketplace: form.marketplace,
                    salePrice: form.salePrice,
                    commissionRate,
                    commissionValue,
                    partnerValue,
                    buyerName: form.buyerName,
                    status: 'pendente',
                    saleDate: serverTimestamp(),
                    createdAt: serverTimestamp(),
                });

                transaction.set(transactionRef, {
                    type: 'SALE',
                    partnerId: product.partnerId,
                    partnerName: product.partnerName,
                    productId: product.id,
                    productName: product.name,
                    grossValue: form.salePrice,
                    commissionValue,
                    netPartnerValue: partnerValue,
                    description: `Venda via ${form.marketplace} - Comprador: ${form.buyerName}`,
                    createdAt: serverTimestamp(),
                });

                transaction.set(logRef, {
                    action: 'SALE_COMPLETED',
                    entityId: saleRef.id,
                    entityType: 'sale',
                    description: `Produto ${product.name} vendido. Estoque restante: ${newQuantity}.`,
                    createdAt: serverTimestamp(),
                });

                transaction.update(productRef, {
                    quantity: newQuantity,
                    status: newQuantity <= 0 ? 'vendido' : currentStatus,
                    updatedAt: serverTimestamp(),
                });

                if (partnerSnap.exists()) {
                    transaction.update(partnerRef, {
                        totalSold: increment(1),
                        totalRevenue: increment(form.salePrice),
                    });
                }
            });

            await addNotification(
                isAdmin ? profile?.uid || '' : 'admin_uid_placeholder',
                'Venda Segura Registrada!',
                `O produto ${product.name} foi vendido por ${formatCurrency(form.salePrice)}.`,
                'success',
                '/dashboard/vendas'
            );

            setSuccess('Venda registrada com sucesso!');
            await fetchData();
            setTimeout(() => { setShowModal(false); setSuccess(''); }, 1500);
        } catch (saveError) {
            const message = saveError instanceof Error ? saveError.message : 'Erro ao registrar venda';
            setError(message);
            console.error(saveError);
        } finally {
            setSaving(false);
        }
    }

    async function updateSaleStatus(saleId: string, newStatus: string) {
        try {
            await updateDoc(doc(db, 'sales', saleId), { status: newStatus });
            await fetchData();
        } catch (updateError) {
            console.error(updateError);
        }
    }

    const filtered = sales.filter(s =>
        !search ||
        s.productName.toLowerCase().includes(search.toLowerCase()) ||
        s.marketplace.toLowerCase().includes(search.toLowerCase()) ||
        s.buyerName.toLowerCase().includes(search.toLowerCase())
    );

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
                <div>
                    <h1 className="page-title">Vendas</h1>
                    <p className="page-subtitle">{isAdmin ? 'Todas as vendas realizadas' : 'Minhas vendas'}</p>
                </div>
                <button className="btn-primary" onClick={() => { setForm({ productId: '', marketplace: 'Mercado Livre', salePrice: 0, buyerName: '' }); setError(''); setSuccess(''); setShowModal(true); }}>
                    <Plus size={18} /> Nova Venda
                </button>
            </div>

            <div className="search-bar" style={{ marginBottom: 24 }}>
                <Search size={18} style={{ color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Buscar por produto, marketplace ou comprador..." className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <ShoppingCart size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3>Nenhuma venda registrada</h3>
                    <p>Clique em &quot;Nova Venda&quot; para registrar</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Marketplace</th>
                                <th>Comprador</th>
                                <th>Valor</th>
                                <th>Comissão</th>
                                <th>Status</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((sale) => (
                                <tr key={sale.id}>
                                    <td style={{ fontWeight: 600 }}>{sale.productName}</td>
                                    <td>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sale.marketplace}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{sale.buyerName}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(sale.salePrice)}</td>
                                    <td>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(sale.commissionValue)}</span>
                                            <br />
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sale.commissionRate}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusColor(sale.status)}`}>
                                            {getStatusLabel(sale.status)}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(sale.saleDate)}</td>
                                    <td>
                                        {isAdmin && sale.status !== 'entregue' && sale.status !== 'devolvido' && (
                                            <select
                                                className="input"
                                                style={{ padding: '6px 10px', fontSize: 12, width: 'auto', minWidth: 100 }}
                                                value={sale.status}
                                                onChange={(e) => updateSaleStatus(sale.id, e.target.value)}
                                            >
                                                <option value="pendente">Pendente</option>
                                                <option value="enviado">Enviado</option>
                                                <option value="entregue">Entregue</option>
                                                <option value="devolvido">Devolvido</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal glass-strong" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Registrar Venda</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            {error && <div className="form-message form-error"><AlertCircle size={16} /><span>{error}</span></div>}
                            {success && <div className="form-message form-success"><CheckCircle size={16} /><span>{success}</span></div>}

                            <div className="form-field">
                                <label className="label">Produto *</label>
                                <select className="input" value={form.productId} onChange={(e) => {
                                    const selectedProduct = products.find(x => x.id === e.target.value);
                                    setForm({ ...form, productId: e.target.value, salePrice: selectedProduct?.price || 0 });
                                }} required>
                                    <option value="">Selecione o produto</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.brand} {p.model} ({formatCurrency(p.price)})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label className="label">Marketplace *</label>
                                    <select className="input" value={form.marketplace} onChange={(e) => setForm({ ...form, marketplace: e.target.value })}>
                                        {marketplaces.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label className="label">Valor da Venda (R$) *</label>
                                    <input className="input" type="number" min="0" step="0.01" value={form.salePrice || ''} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} required />
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="label">Nome do Comprador</label>
                                <input className="input" placeholder="Nome do comprador" value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Registrar Venda'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
        .page-subtitle { font-size: 14px; color: var(--text-secondary); }
        .search-bar { display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; padding: 0 16px; transition: border-color 0.3s; }
        .search-bar:focus-within { border-color: var(--accent-primary); }
        .search-input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 14px; font-family: 'Inter', sans-serif; padding: 14px 0; outline: none; }
        .search-input::placeholder { color: var(--text-muted); }
        .empty-state { text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px; }
        .empty-state h3 { font-size: 16px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary); }
        .empty-state p { font-size: 13px; color: var(--text-muted); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal { width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; border-radius: 24px; padding: 32px; animation: fadeIn 0.3s ease-out; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .modal-header h2 { font-size: 20px; font-weight: 700; }
        .modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
        .modal-form { display: flex; flex-direction: column; gap: 20px; }
        .form-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-field { display: flex; flex-direction: column; }
        .form-message { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 500; }
        .form-error { background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.2); color: var(--danger); }
        .form-success { background: rgba(0,184,148,0.1); border: 1px solid rgba(0,184,148,0.2); color: var(--success); }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 8px; }
        @media (max-width: 640px) { .form-grid-2 { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    );
}
