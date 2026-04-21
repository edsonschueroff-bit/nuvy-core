'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Partner } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Building2,
    Phone,
    Mail,
    MapPin,
    Percent,
    Loader2,
    AlertCircle,
    CheckCircle,
    Eye,
} from 'lucide-react';
import Link from 'next/link';

interface PartnerFormData {
    companyName: string;
    cnpj: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
    commissionRate: number;
    loginEmail: string;
    loginPassword: string;
}

const emptyForm: PartnerFormData = {
    companyName: '',
    cnpj: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    commissionRate: 20,
    loginEmail: '',
    loginPassword: '',
};

export default function ParceirosPage() {
    const { isAdmin, demoMode } = useAuth();
    const { isFirebaseConfigured } = require('@/lib/firebase');
    const router = useRouter();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PartnerFormData>(emptyForm);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard');
            return;
        }
        fetchPartners();
    }, [isAdmin, router, demoMode]);

    async function fetchPartners() {
        if (!isFirebaseConfigured || demoMode) {
            setPartners([
                { id: '1', companyName: 'NetLink Telecom', cnpj: '00.000.000/0001-01', contactName: 'João Silva', phone: '(11) 99999-9999', email: 'joao@netlink.com', address: 'Av Paulista, 1000', commissionRate: 20, totalProducts: 34, totalSold: 12, totalRevenue: 15000, isActive: true, createdAt: new Date() },
                { id: '2', companyName: 'FiberFast Internet', cnpj: '11.111.111/0001-11', contactName: 'Maria Cruz', phone: '(21) 98888-8888', email: 'maria@fiber.com', address: 'Centro Empresarial', commissionRate: 15, totalProducts: 11, totalSold: 8, totalRevenue: 9500, isActive: true, createdAt: new Date() },
            ]);
            setLoading(false);
            return;
        }

        try {
            const snap = await getDocs(collection(db, 'partners'));
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
            })) as Partner[];
            setPartners(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        } catch (err) {
            console.error('Erro ao carregar parceiros:', err);
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setForm(emptyForm);
        setEditingId(null);
        setError('');
        setSuccess('');
        setShowModal(true);
    }

    function openEdit(partner: Partner) {
        setForm({
            companyName: partner.companyName,
            cnpj: partner.cnpj,
            contactName: partner.contactName,
            phone: partner.phone,
            email: partner.email,
            address: partner.address,
            commissionRate: partner.commissionRate,
            loginEmail: '',
            loginPassword: '',
        });
        setEditingId(partner.id);
        setError('');
        setSuccess('');
        setShowModal(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingId) {
                // Update
                await updateDoc(doc(db, 'partners', editingId), {
                    companyName: form.companyName,
                    cnpj: form.cnpj,
                    contactName: form.contactName,
                    phone: form.phone,
                    email: form.email,
                    address: form.address,
                    commissionRate: form.commissionRate,
                });
                setSuccess('Parceiro atualizado com sucesso!');
            } else {
                // Create partner
                const partnerRef = await addDoc(collection(db, 'partners'), {
                    companyName: form.companyName,
                    cnpj: form.cnpj,
                    contactName: form.contactName,
                    phone: form.phone,
                    email: form.email,
                    address: form.address,
                    commissionRate: form.commissionRate,
                    totalProducts: 0,
                    totalSold: 0,
                    totalRevenue: 0,
                    isActive: true,
                    createdAt: serverTimestamp(),
                });

                // Create user for partner login (if credentials provided)
                if (form.loginEmail && form.loginPassword) {
                    try {
                        const userCred = await createUserWithEmailAndPassword(auth, form.loginEmail, form.loginPassword);
                        // Save user profile
                        const { setDoc } = await import('firebase/firestore');
                        await setDoc(doc(db, 'users', userCred.user.uid), {
                            email: form.loginEmail,
                            name: form.contactName,
                            role: 'parceiro',
                            partnerId: partnerRef.id,
                            createdAt: serverTimestamp(),
                        });
                    } catch (authErr: unknown) {
                        const msg = authErr instanceof Error ? authErr.message : '';
                        if (msg.includes('email-already-in-use')) {
                            setError('Este email de login já está em uso');
                        } else {
                            setError('Parceiro criado, mas erro ao criar login: ' + msg);
                        }
                    }
                }

                setSuccess('Parceiro cadastrado com sucesso!');
            }

            await fetchPartners();
            setTimeout(() => {
                setShowModal(false);
                setSuccess('');
            }, 1500);
        } catch (err) {
            setError('Erro ao salvar parceiro');
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
        try {
            await deleteDoc(doc(db, 'partners', id));
            await fetchPartners();
        } catch (err) {
            console.error('Erro ao excluir:', err);
        }
    }

    const filtered = partners.filter(p =>
        p.companyName.toLowerCase().includes(search.toLowerCase()) ||
        p.contactName.toLowerCase().includes(search.toLowerCase()) ||
        p.cnpj.includes(search)
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
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Parceiros</h1>
                    <p className="page-subtitle">Gerencie as empresas parceiras</p>
                </div>
                <Link href="/dashboard/parceiros/novo" className="btn-primary">
                    <Plus size={18} />
                    Novo Parceiro
                </Link>
            </div>

            {/* Search */}
            <div className="search-bar">
                <Search size={18} style={{ color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por nome, contato ou CNPJ..."
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Partner Cards */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3>{search ? 'Nenhum parceiro encontrado' : 'Nenhum parceiro cadastrado'}</h3>
                    <p>{search ? 'Tente outra busca' : 'Clique em "Novo Parceiro" para começar'}</p>
                </div>
            ) : (
                <div className="partners-grid">
                    {filtered.map((partner) => (
                        <div key={partner.id} className="card partner-card">
                            <div className="partner-card-header">
                                <div className="partner-avatar">
                                    <Building2 size={22} />
                                </div>
                                <div className="partner-info">
                                    <h3>{partner.companyName}</h3>
                                    <p>{partner.cnpj}</p>
                                </div>
                                <div className={`partner-status ${partner.isActive ? 'status-active' : 'status-inactive'}`}>
                                    {partner.isActive ? 'Ativo' : 'Inativo'}
                                </div>
                            </div>

                            <div className="partner-details">
                                <div className="partner-detail">
                                    <Phone size={14} />
                                    <span>{partner.phone || '—'}</span>
                                </div>
                                <div className="partner-detail">
                                    <Mail size={14} />
                                    <span>{partner.email || '—'}</span>
                                </div>
                                <div className="partner-detail">
                                    <Percent size={14} />
                                    <span>Comissão: {partner.commissionRate}%</span>
                                </div>
                            </div>

                            <div className="partner-stats">
                                <div className="partner-stat">
                                    <span className="partner-stat-value">{partner.totalProducts}</span>
                                    <span className="partner-stat-label">Produtos</span>
                                </div>
                                <div className="partner-stat">
                                    <span className="partner-stat-value">{partner.totalSold}</span>
                                    <span className="partner-stat-label">Vendidos</span>
                                </div>
                                <div className="partner-stat">
                                    <span className="partner-stat-value">{formatCurrency(partner.totalRevenue)}</span>
                                    <span className="partner-stat-label">Receita</span>
                                </div>
                            </div>

                            <div className="partner-actions">
                                <Link href={`/dashboard/parceiros/${partner.id}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
                                    <Eye size={14} />
                                    Detalhes
                                </Link>
                                <button className="btn-secondary" onClick={() => openEdit(partner)} style={{ padding: '8px 12px' }}>
                                    <Edit2 size={14} />
                                </button>
                                <button className="btn-danger" onClick={() => handleDelete(partner.id, partner.companyName)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal glass-strong" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Editar Parceiro' : 'Novo Parceiro'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="modal-form">
                            {error && (
                                <div className="form-message form-error">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                            {success && (
                                <div className="form-message form-success">
                                    <CheckCircle size={16} />
                                    <span>{success}</span>
                                </div>
                            )}

                            <div className="form-grid">
                                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Nome da Empresa *</label>
                                    <input
                                        className="input"
                                        placeholder="Ex: NetLink Telecom"
                                        value={form.companyName}
                                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">CNPJ</label>
                                    <input
                                        className="input"
                                        placeholder="00.000.000/0001-00"
                                        value={form.cnpj}
                                        onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Nome do Contato *</label>
                                    <input
                                        className="input"
                                        placeholder="Nome do responsável"
                                        value={form.contactName}
                                        onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Telefone</label>
                                    <input
                                        className="input"
                                        placeholder="(00) 00000-0000"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Email</label>
                                    <input
                                        className="input"
                                        type="email"
                                        placeholder="contato@empresa.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>

                                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Endereço</label>
                                    <input
                                        className="input"
                                        placeholder="Endereço completo"
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Comissão (%)</label>
                                    <input
                                        className="input"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={form.commissionRate}
                                        onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Login credentials for new partner */}
                            {!editingId && (
                                <div className="form-section">
                                    <h3 className="form-section-title">Acesso do Parceiro</h3>
                                    <p className="form-section-desc">Crie as credenciais de login para o parceiro acessar o sistema</p>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label className="label">Email de Login</label>
                                            <input
                                                className="input"
                                                type="email"
                                                placeholder="login@empresa.com"
                                                value={form.loginEmail}
                                                onChange={(e) => setForm({ ...form, loginEmail: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label className="label">Senha Inicial</label>
                                            <input
                                                className="input"
                                                type="text"
                                                placeholder="Senha de acesso"
                                                value={form.loginPassword}
                                                onChange={(e) => setForm({ ...form, loginPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        editingId ? 'Salvar Alterações' : 'Cadastrar Parceiro'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }

        /* Search */
        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 0 16px;
          margin-bottom: 24px;
          transition: border-color 0.3s;
        }

        .search-bar:focus-within {
          border-color: var(--accent-primary);
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          padding: 14px 0;
          outline: none;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        /* Partners grid */
        .partners-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .partner-card {
          padding: 24px;
        }

        .partner-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .partner-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(108, 92, 231, 0.1);
          color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .partner-info {
          flex: 1;
          min-width: 0;
        }

        .partner-info h3 {
          font-size: 16px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .partner-info p {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .partner-status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .status-active {
          background: rgba(0, 184, 148, 0.1);
          color: var(--success);
        }

        .status-inactive {
          background: rgba(255, 107, 107, 0.1);
          color: var(--danger);
        }

        .partner-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .partner-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .partner-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 16px 0;
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 16px;
        }

        .partner-stat {
          text-align: center;
        }

        .partner-stat-value {
          display: block;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .partner-stat-label {
          font-size: 11px;
          color: var(--text-muted);
        }

        .partner-actions {
          display: flex;
          gap: 8px;
        }

        .partner-actions .btn-secondary {
          flex: 1;
          justify-content: center;
          padding: 8px;
          font-size: 13px;
        }

        .partner-actions .btn-danger {
          padding: 8px 12px;
          font-size: 13px;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 16px;
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }

        .empty-state p {
          font-size: 13px;
          color: var(--text-muted);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 640px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 24px;
          padding: 32px;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: var(--text-primary);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }

        .form-section {
          padding-top: 20px;
          border-top: 1px solid var(--border-subtle);
        }

        .form-section-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .form-section-desc {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .form-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .form-error {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: var(--danger);
        }

        .form-success {
          background: rgba(0, 184, 148, 0.1);
          border: 1px solid rgba(0, 184, 148, 0.2);
          color: var(--success);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 8px;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-grid .form-field[style*="grid-column"] {
            grid-column: span 1 !important;
          }

          .partners-grid {
            grid-template-columns: 1fr;
          }

          .modal {
            padding: 24px 20px;
          }
        }
      `}</style>
        </div>
    );
}
