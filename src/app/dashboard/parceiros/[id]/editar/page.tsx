'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Users,
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    Building2,
    User,
    Phone,
    Mail,
    MapPin,
    Percent
} from 'lucide-react';
import { Partner } from '@/types';

export default function EditarParceiroPage() {
    const router = useRouter();
    const { id } = useParams();
    const { isAdmin, demoMode } = useAuth();
    const { addNotification } = useNotifications();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        cnpj: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        commissionRate: 20,
        isActive: true
    });

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard');
            return;
        }

        async function fetchPartner() {
            if (demoMode) {
                setFormData({
                    companyName: 'Empresa Teste (Demo)',
                    cnpj: '12.345.678/0001-90',
                    contactName: 'João Silva',
                    phone: '(11) 99999-9999',
                    email: 'contato@teste.com',
                    address: 'Rua Teste, 123',
                    commissionRate: 15,
                    isActive: true
                });
                setLoading(false);
                return;
            }

            try {
                const snap = await getDoc(doc(db, 'partners', id as string));
                if (snap.exists()) {
                    const data = snap.data() as Partner;
                    setFormData({
                        companyName: data.companyName || '',
                        cnpj: data.cnpj || '',
                        contactName: data.contactName || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        address: data.address || '',
                        commissionRate: data.commissionRate || 20,
                        isActive: data.isActive !== undefined ? data.isActive : true
                    });
                } else {
                    router.push('/dashboard/parceiros');
                }
            } catch (err) {
                console.error('Erro ao carregar parceiro:', err);
                setError('Erro ao carregar dados do parceiro.');
            } finally {
                setLoading(false);
            }
        }

        fetchPartner();
    }, [id, isAdmin, demoMode, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (demoMode) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                setSuccess('Alterações salvas com sucesso! (Modo Demo)');
                setTimeout(() => router.push(`/dashboard/parceiros/${id}`), 2000);
                return;
            }

            await updateDoc(doc(db, 'partners', id as string), {
                ...formData,
                commissionRate: Number(formData.commissionRate),
                updatedAt: serverTimestamp(),
            });

            await addNotification(
                'admin',
                'Cadastro Atualizado',
                `Os dados de ${formData.companyName} foram atualizados.`,
                'info',
                `/dashboard/parceiros/${id}`
            );

            setSuccess('Dados atualizados com sucesso!');
            setTimeout(() => router.push(`/dashboard/parceiros/${id}`), 1500);

        } catch (err: any) {
            console.error('Erro ao editar parceiro:', err);
            setError(err.message || 'Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as any).checked : value
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-accent-primary" />
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            <header className="page-header flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="page-title text-2xl font-bold">Editar Parceiro</h1>
                    <p className="page-subtitle text-text-secondary text-sm">Atualize os dados cadastrais da empresa.</p>
                </div>
            </header>

            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="form-container space-y-6">
                    {error && (
                        <div className="form-message form-error animate-slide-up">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="form-message form-success animate-slide-up">
                            <Save size={20} />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="glass-card p-6 md:p-8 space-y-8">
                        <section>
                            <div className="flex items-center gap-2 mb-6 text-accent-primary">
                                <Building2 size={20} />
                                <h3 className="font-semibold uppercase tracking-wider text-xs">Identificação da Empresa</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-field">
                                    <label className="label">Razão Social / Nome Fantasia *</label>
                                    <div className="input-wrapper">
                                        <Building2 className="input-icon" size={18} />
                                        <input
                                            name="companyName"
                                            className="input"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label className="label">CNPJ *</label>
                                    <div className="input-wrapper">
                                        <Building2 className="input-icon" size={18} />
                                        <input
                                            name="cnpj"
                                            className="input"
                                            value={formData.cnpj}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-white/5" />

                        <section>
                            <div className="flex items-center gap-2 mb-6 text-accent-primary">
                                <User size={20} />
                                <h3 className="font-semibold uppercase tracking-wider text-xs">Informações de Contato</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-field">
                                    <label className="label">Nome do Responsável *</label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" size={18} />
                                        <input
                                            name="contactName"
                                            className="input"
                                            value={formData.contactName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label className="label">Telefone / WhatsApp *</label>
                                    <div className="input-wrapper">
                                        <Phone className="input-icon" size={18} />
                                        <input
                                            name="phone"
                                            className="input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label className="label">E-mail Corporativo *</label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" size={18} />
                                        <input
                                            name="email"
                                            type="email"
                                            className="input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label className="label">Endereço / Cidade</label>
                                    <div className="input-wrapper">
                                        <MapPin className="input-icon" size={18} />
                                        <input
                                            name="address"
                                            className="input"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-white/5" />

                        <section>
                            <div className="flex items-center gap-2 mb-6 text-accent-primary">
                                <Percent size={20} />
                                <h3 className="font-semibold uppercase tracking-wider text-xs">Configurações Comerciais</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-field">
                                    <label className="label">Taxa de Comissão (%) *</label>
                                    <div className="input-wrapper">
                                        <Percent className="input-icon" size={18} />
                                        <input
                                            name="commissionRate"
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="input"
                                            value={formData.commissionRate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label className="label">Status da Conta</label>
                                    <select
                                        name="isActive"
                                        className="input pr-4"
                                        value={formData.isActive ? 'true' : 'false'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                                    >
                                        <option value="true">Ativo</option>
                                        <option value="false">Inativo / Bloqueado</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <div className="flex items-center justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn-secondary px-8"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn-primary px-8"
                                disabled={saving}
                            >
                                {saving ? (
                                    <><Loader2 size={18} className="animate-spin mr-2" /> Salvando...</>
                                ) : (
                                    <><Save size={18} className="mr-2" /> Salvar Alterações</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                }
                .label { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; display: block; }
                .input-wrapper { position: relative; display: flex; align-items: center; }
                .input-icon { position: absolute; left: 16px; color: var(--text-muted); pointer-events: none; }
                .input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 12px 16px 12px 48px;
                    border-radius: 12px;
                    font-size: 14px;
                }
                .input:focus { border-color: var(--accent-primary); outline: none; background: rgba(255, 255, 255, 0.08); }
                .form-message { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; margin-bottom: 24px; }
                .form-error { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.2); }
                .form-success { background: rgba(0, 184, 148, 0.1); color: #00b894; border: 1px solid rgba(0,184,148,0.2); }
            `}</style>
        </div>
    );
}
