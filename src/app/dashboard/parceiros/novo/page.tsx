'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { provisionPartnerAccess } from '@/lib/partner-access';
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

export default function NovoParceiroPage() {
    const router = useRouter();
    const { isAdmin, demoMode } = useAuth();
    const { addNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
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
        loginEmail: '',
        loginPassword: '',
    });

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-danger/10 border border-danger/20 rounded-2xl max-w-md">
                    <AlertCircle size={48} className="mx-auto text-danger mb-4" />
                    <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                    <p className="text-text-secondary">Apenas administradores podem cadastrar novos parceiros.</p>
                    <button onClick={() => router.back()} className="mt-6 btn-secondary w-full">Voltar</button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (demoMode) {
                // Mock behavior for demo mode
                await new Promise(resolve => setTimeout(resolve, 1500));

                await addNotification(
                    'demo-admin',
                    'Parceiro e Usuário Criados!',
                    `O parceiro ${formData.companyName} e o usuário ${formData.loginEmail} foram simulados com sucesso.`,
                    'info',
                    '/dashboard/parceiros'
                );

                setSuccess('Parceiro registrado com sucesso! (Modo Demo)');
                setTimeout(() => router.push('/dashboard/parceiros'), 2000);
                return;
            }

            // Real Firestore logic
            // 1. Check if email or CNPJ already exists
            const cnpjQuery = query(collection(db, 'partners'), where('cnpj', '==', formData.cnpj));
            const cnpjSnap = await getDocs(cnpjQuery);
            if (!cnpjSnap.empty) {
                setError('Um parceiro com este CNPJ já está cadastrado.');
                setLoading(false);
                return;
            }

            // 2. Add to partners collection
            const partnerRef = await addDoc(collection(db, 'partners'), {
                companyName: formData.companyName,
                cnpj: formData.cnpj,
                contactName: formData.contactName,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                commissionRate: Number(formData.commissionRate),
                totalProducts: 0,
                totalSold: 0,
                totalRevenue: 0,
                isActive: true,
                createdAt: serverTimestamp(),
            });

            // 2.5 Create Auth User & User Profile without swapping the current admin session
            if (formData.loginEmail && formData.loginPassword) {
                await provisionPartnerAccess({
                    loginEmail: formData.loginEmail,
                    loginPassword: formData.loginPassword,
                    contactName: formData.contactName,
                    partnerId: partnerRef.id,
                });
            }

            // 3. Notify Admin
            await addNotification(
                'admin', // In real app, this would be a real admin user ID
                'Novo Parceiro Cadastrado!',
                `${formData.companyName} agora faz parte da Nuvy Core.`,
                'success',
                `/dashboard/parceiros/${partnerRef.id}`
            );

            setSuccess('Parceiro cadastrado com sucesso!');
            setTimeout(() => router.push('/dashboard/parceiros'), 2000);

        } catch (err: unknown) {
            console.error('Erro ao cadastrar parceiro:', err);
            setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="page animate-fade-in">
            <header className="page-header flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="page-title text-2xl font-bold">Novo Parceiro</h1>
                    <p className="page-subtitle text-text-secondary text-sm">Cadastre uma nova empresa fornecedora de equipamentos.</p>
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
                        {/* Seção: Identificação */}
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
                                            placeholder="Ex: NetLink Telecom"
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
                                            placeholder="00.000.000/0000-00"
                                            value={formData.cnpj}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-white/5" />

                        {/* Seção: Contato */}
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
                                            placeholder="Nome completo"
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
                                            placeholder="(00) 00000-0000"
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
                                            placeholder="contato@empresa.com"
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
                                            placeholder="Rua, Número, Cidade - UF"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-white/5" />

                        {/* Seção: Acesso ao Sistema */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 text-accent-primary">
                                <Users size={20} />
                                <h3 className="font-semibold uppercase tracking-wider text-xs">Acesso do Parceiro</h3>
                                <div className="ml-auto bg-accent-primary/10 text-accent-primary text-[10px] px-2 py-1 rounded-full border border-accent-primary/20">
                                    CRIAÇÃO AUTOMÁTICA
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-field">
                                    <label className="label">E-mail de Login *</label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" size={18} />
                                        <input
                                            name="loginEmail"
                                            type="email"
                                            className="input"
                                            placeholder="acesso@parceiro.com"
                                            value={formData.loginEmail}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] text-text-muted italic">Este e-mail será usado para o parceiro acessar este painel.</p>
                                </div>
                                <div className="form-field">
                                    <label className="label">Senha Inicial *</label>
                                    <div className="input-wrapper">
                                        <AlertCircle className="input-icon" size={18} />
                                        <input
                                            name="loginPassword"
                                            type="password"
                                            className="input"
                                            placeholder="Mínimo 6 caracteres"
                                            value={formData.loginPassword}
                                            onChange={handleChange}
                                            required
                                            minLength={6}
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

                            <div className="max-w-xs">
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
                                    <p className="mt-2 text-[10px] text-text-muted italic">Esta taxa será aplicada automaticamente a todas as vendas deste parceiro.</p>
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
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 size={18} className="animate-spin mr-2" /> Salvando...</>
                                ) : (
                                    <><Save size={18} className="mr-2" /> Salvar Parceiro</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .form-container {
                    animation: slideUp 0.4s ease-out;
                }
                
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }

                .form-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .label {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary);
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 16px;
                    color: var(--text-muted);
                    pointer-events: none;
                }

                .input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 12px 16px 12px 48px;
                    border-radius: 12px;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .input:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: var(--accent-primary);
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.15);
                }

                .form-message {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 500;
                }

                .form-error {
                    background: rgba(255, 107, 107, 0.1);
                    border: 1px solid rgba(255, 107, 107, 0.2);
                    color: #ff6b6b;
                }

                .form-success {
                    background: rgba(0, 184, 148, 0.1);
                    border: 1px solid rgba(0, 184, 148, 0.2);
                    color: #00b894;
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
