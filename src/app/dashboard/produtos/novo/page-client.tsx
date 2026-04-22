'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    getDoc,
    query,
    orderBy,
    updateDoc,
    doc,
    increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import {
    Package,
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    Tag,
    Layers,
    Settings,
    Barcode,
    DollarSign,
    Image as ImageIcon,
    Building2,
    CheckCircle,
    Upload
} from 'lucide-react';
import ImageUpload from '@/components/shared/ImageUpload';
import { Partner } from '@/types';

export default function NovoProdutoPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const partnerIdFromQuery = searchParams.get('partnerId');
    const { profile, isAdmin, demoMode } = useAuth();
    const { addNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [partnersLoading, setPartnersLoading] = useState(true);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        model: '',
        category: 'ONU',
        condition: 'Usado',
        serialNumber: '',
        price: '',
        partnerId: partnerIdFromQuery ?? '',
        description: '',
        quantity: 1,
    });

    const fetchPartners = async () => {
        try {
            if (demoMode) {
                setPartners([
                    { id: '1', companyName: 'NetLink Telecom' } as Partner,
                    { id: '2', companyName: 'GigaByte Provedor' } as Partner
                ]);
            } else {
                const q = query(collection(db, 'partners'), orderBy('companyName'));
                const snap = await getDocs(q);
                setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Partner));
            }
        } catch (err) {
            console.error('Erro ao buscar parceiros:', err);
        } finally {
            setPartnersLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, [demoMode]);

    useEffect(() => {
        if (partnerIdFromQuery) {
            setFormData(prev => prev.partnerId === partnerIdFromQuery ? prev : { ...prev, partnerId: partnerIdFromQuery });
        }
    }, [partnerIdFromQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.partnerId && isAdmin) {
            setError('Por favor, selecione um parceiro vinculado.');
            setLoading(false);
            return;
        }

        try {
            const partner = partners.find(p => p.id === (isAdmin ? formData.partnerId : profile?.partnerId));
            const finalPartnerId = isAdmin ? formData.partnerId : profile?.partnerId;
            const finalPartnerName = partner?.companyName || 'Parceiro Desconhecido';

            if (demoMode) {
                await new Promise(resolve => setTimeout(resolve, 1500));

                const imageUrls = imageFiles.map(file => URL.createObjectURL(file));

                await addNotification(
                    profile?.uid || 'demo-admin',
                    'Produto Cadastrado!',
                    `${formData.name} foi adicionado ao seu inventário com ${imageUrls.length} fotos.`,
                    'success',
                    '/dashboard/produtos'
                );

                setSuccess('Produto cadastrado com sucesso! (Modo Demo)');
                setTimeout(() => router.push('/dashboard/produtos'), 2000);
                return;
            }

            const productRef = await addDoc(collection(db, 'products'), {
                ...formData,
                price: Number(formData.price),
                quantity: Number(formData.quantity || 1),
                partnerId: finalPartnerId,
                partnerName: finalPartnerName,
                status: 'disponivel',
                images: [],
                createdAt: serverTimestamp(),
            });

            if (imageFiles.length > 0) {
                try {
                    setUploading(true);
                    const imageUrls = [];

                    for (let i = 0; i < imageFiles.length; i++) {
                        const file = imageFiles[i];
                        const storageRef = ref(storage, `products/${productRef.id}/img_${i}_${Date.now()}`);
                        await uploadBytes(storageRef, file);
                        const url = await getDownloadURL(storageRef);
                        imageUrls.push(url);
                    }

                    await updateDoc(doc(db, 'products', productRef.id), {
                        images: imageUrls
                    });
                } catch (imgErr) {
                    console.error('Erro ao subir imagens:', imgErr);
                } finally {
                    setUploading(false);
                }
            }

            if (finalPartnerId && !demoMode) {
                try {
                    await updateDoc(doc(db, 'partners', finalPartnerId), {
                        totalProducts: increment(1)
                    });
                } catch (pErr) {
                    console.error('Erro ao atualizar contador:', pErr);
                }
            }

            await addNotification(
                finalPartnerId || 'admin',
                'Novo Equipamento Recebido',
                `${formData.name} (${formData.model}) foi cadastrado no sistema.`,
                'info',
                `/dashboard/produtos/${productRef.id}`
            );

            setSuccess('Produto cadastrado com sucesso!');
            setTimeout(() => router.push('/dashboard/produtos'), 2000);

        } catch (err: any) {
            console.error('Erro ao cadastrar produto:', err);
            setError('Falha ao salvar produto. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-danger/10 border border-danger/20 rounded-2xl max-w-md">
                    <AlertCircle size={48} className="mx-auto text-danger mb-4" />
                    <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
                    <p className="text-text-secondary">Apenas o administrador pode cadastrar novos equipamentos para garantir o controle de estoque.</p>
                    <button onClick={() => router.push('/dashboard/produtos')} className="mt-6 btn-secondary w-full">Voltar para Produtos</button>
                </div>
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
                    <h1 className="page-title text-2xl font-bold">Novo Produto</h1>
                    <p className="page-subtitle text-text-secondary text-sm">Adicione um novo equipamento ao estoque de consignação.</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="form-container grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card p-6 md:p-8 space-y-6">
                            <div className="form-field">
                                <label className="label">Nome do Equipamento *</label>
                                <div className="input-wrapper">
                                    <Package className="input-icon" size={18} />
                                    <input
                                        name="name"
                                        className="input"
                                        placeholder="Ex: ONU Huawei EchoLife"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-field">
                                    <label className="label">Marca *</label>
                                    <div className="input-wrapper">
                                        <Tag className="input-icon" size={18} />
                                        <input
                                            name="brand"
                                            className="input"
                                            placeholder="Ex: Huawei"
                                            value={formData.brand}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label className="label">Modelo *</label>
                                    <div className="input-wrapper">
                                        <Settings className="input-icon" size={18} />
                                        <input
                                            name="model"
                                            className="input"
                                            placeholder="Ex: EG8141A5"
                                            value={formData.model}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="label">Descrição Técnica / Observações</label>
                                <textarea
                                    name="description"
                                    className="textarea"
                                    placeholder="Detalhes sobre funcionamento, defeitos estéticos, etc."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="glass-card p-6 md:p-8 space-y-6">
                            <div className="flex items-center gap-2 mb-4 text-accent-primary">
                                <Upload size={20} />
                                <h3 className="font-semibold uppercase tracking-wider text-xs">Fotos do Equipamento</h3>
                            </div>

                            <ImageUpload
                                onImagesChange={setImageFiles}
                                maxImages={5}
                            />

                            {demoMode && imageFiles.length > 0 && (
                                <p className="text-[10px] text-accent-primary/60 italic text-center">
                                    No modo demo, as imagens serão apenas simuladas no cadastro.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card p-6 space-y-6">
                            <div className="form-field">
                                <label className="label">Categoria *</label>
                                <select name="category" className="input pr-4" value={formData.category} onChange={handleChange}>
                                    <option value="OLT">OLT</option>
                                    <option value="ONU">ONU</option>
                                    <option value="Switch">Switch</option>
                                    <option value="Roteador">Roteador</option>
                                    <option value="Cabo">Cabo</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label className="label">Estado de Conservação *</label>
                                <select name="condition" className="input pr-4" value={formData.condition} onChange={handleChange}>
                                    <option value="Novo">Novo</option>
                                    <option value="Semi-novo">Semi-novo</option>
                                    <option value="Usado">Usado</option>
                                    <option value="Para peças">Para peças</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label className="label">Nº de Série *</label>
                                <div className="input-wrapper">
                                    <Barcode className="input-icon" size={18} />
                                    <input
                                        name="serialNumber"
                                        className="input"
                                        placeholder="SN / ID do Equipamento"
                                        value={formData.serialNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-field">
                                    <label className="label">Preço Unitário (R$) *</label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" size={18} />
                                        <input
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            className="input"
                                            placeholder="0,00"
                                            value={formData.price}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label className="label">Quantidade em Estoque *</label>
                                    <div className="input-wrapper">
                                        <Layers className="input-icon" size={18} />
                                        <input
                                            name="quantity"
                                            type="number"
                                            min="1"
                                            className="input"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="glass-card p-6 border-l-4 border-accent-primary">
                                <div className="form-field">
                                    <label className="label flex items-center gap-2">
                                        <Building2 size={14} /> Parceiro Vinculado *
                                    </label>
                                    <select
                                        name="partnerId"
                                        className="input mt-2"
                                        value={formData.partnerId}
                                        onChange={handleChange}
                                        disabled={partnersLoading}
                                    >
                                        <option value="">Selecione um parceiro</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>{p.companyName}</option>
                                        ))}
                                    </select>
                                    {partnersLoading && <p className="text-[10px] text-text-muted mt-1 animate-pulse">Carregando parceiros...</p>}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                type="submit"
                                className="btn-primary w-full py-4 text-base shadow-xl shadow-accent-primary/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 size={20} className="animate-spin mr-2" /> Salvando...</>
                                ) : (
                                    <><CheckCircle size={20} className="mr-2" /> Concluir Cadastro</>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn-secondary w-full"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </form>

                {error && <div className="mt-6 form-message form-error animate-slide-up"><AlertCircle size={20} /><span>{error}</span></div>}
                {success && <div className="mt-6 form-message form-success animate-slide-up"><CheckCircle size={20} /><span>{success}</span></div>}
            </div>

            <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                }

                .form-field { display: flex; flex-direction: column; gap: 8px; }
                .label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
                .input-wrapper { position: relative; display: flex; align-items: center; }
                .input-icon { position: absolute; left: 16px; color: var(--text-muted); pointer-events: none; }
                
                .input, .textarea {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 12px 16px 12px 48px;
                    border-radius: 12px;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .textarea { padding: 12px 16px; font-family: inherit; }
                select.input { appearance: none; }

                .input:focus, .textarea:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: var(--accent-primary);
                    outline: none;
                }

                .form-message { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; font-size: 14px; }
                .form-error { background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.2); color: #ff6b6b; }
                .form-success { background: rgba(0, 184, 148, 0.1); border: 1px solid rgba(0, 184, 148, 0.2); color: #00b894; }
            `}</style>
        </div>
    );
}
