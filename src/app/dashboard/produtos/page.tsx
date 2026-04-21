'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp,
    increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '@/lib/firebase';
import { Product, Partner, ProductCategory, ProductCondition, ProductStatus } from '@/types';
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
    Package,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Upload,
    Image as ImageIcon,
    Filter,
    Loader2,
    AlertCircle,
    CheckCircle,
    Grid3X3,
    List,
    Eye,
} from 'lucide-react';
import Link from 'next/link';

const categories: ProductCategory[] = ['OLT', 'ONU', 'Switch', 'Roteador', 'Cabo', 'Outros'];
const conditions: ProductCondition[] = ['Novo', 'Semi-novo', 'Usado', 'Para peças'];
const statuses: ProductStatus[] = ['disponivel', 'anunciado', 'reservado', 'manutencao', 'vendido', 'devolvido'];

interface ProductFormData {
    name: string;
    brand: string;
    model: string;
    category: ProductCategory;
    condition: ProductCondition;
    serialNumber: string;
    price: number;
    partnerId: string;
    description: string;
    status: ProductStatus;
    quantity: number;
}

const emptyForm: ProductFormData = {
    name: '',
    brand: '',
    model: '',
    category: 'ONU',
    condition: 'Semi-novo',
    serialNumber: '',
    price: 0,
    partnerId: '',
    description: '',
    status: 'disponivel',
    quantity: 1,
};

export default function ProdutosPage() {
    const { profile, isAdmin, demoMode } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProductFormData>(emptyForm);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterCondition, setFilterCondition] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, [profile, isAdmin, demoMode]);

    async function fetchData() {
        if (!isFirebaseConfigured || demoMode) {
            setProducts([
                { id: '1', partnerId: '1', partnerName: 'NetLink Telecom', name: 'ONU EPON', brand: 'Huawei', model: 'EG8141A5', category: 'ONU', condition: 'Usado', serialNumber: '123456789', price: 150, status: 'disponivel', images: [], description: '', quantity: 25, createdAt: new Date() } as Product,
                { id: '2', partnerId: '1', partnerName: 'NetLink Telecom', name: 'OLT 8 PON', brand: 'Intelbras', model: 'EPON', category: 'OLT', condition: 'Semi-novo', serialNumber: '987654321', price: 2500, status: 'anunciado', images: [], description: '', quantity: 2, createdAt: new Date() } as Product,
            ]);
            setLoading(false);
            return;
        }

        try {
            // Fetch partners (for admin)
            if (isAdmin) {
                const partnersSnap = await getDocs(collection(db, 'partners'));
                setPartners(partnersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Partner[]);
            }

            // Fetch products
            let productsQuery = query(collection(db, 'products'));
            if (!isAdmin && profile?.partnerId) {
                productsQuery = query(collection(db, 'products'), where('partnerId', '==', profile.partnerId));
            }
            const productsSnap = await getDocs(productsQuery);
            const data = productsSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
            })) as Product[];
            setProducts(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setForm({
            ...emptyForm,
            partnerId: isAdmin ? '' : (profile?.partnerId || ''),
        });
        setEditingId(null);
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setError('');
        setSuccess('');
        setShowModal(true);
    }

    function openEdit(product: Product) {
        setForm({
            name: product.name,
            brand: product.brand,
            model: product.model,
            category: product.category,
            condition: product.condition,
            serialNumber: product.serialNumber,
            price: product.price,
            partnerId: product.partnerId,
            description: product.description || '',
            status: product.status,
            quantity: product.quantity || 1,
        });
        setEditingId(product.id);
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages(product.images || []);
        setError('');
        setSuccess('');
        setShowModal(true);
    }

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        const totalImages = existingImages.length + imageFiles.length + files.length;
        if (totalImages > 5) {
            setError('Máximo de 5 imagens permitidas');
            return;
        }
        setImageFiles([...imageFiles, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setImagePreviews([...imagePreviews, ...newPreviews]);
    }

    function removeNewImage(index: number) {
        setImageFiles(imageFiles.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    }

    function removeExistingImage(index: number) {
        setExistingImages(existingImages.filter((_, i) => i !== index));
    }

    async function uploadImages(): Promise<string[]> {
        if (demoMode) {
            // Simulate upload in demo mode by returning local object URLs
            return imageFiles.map(file => URL.createObjectURL(file));
        }

        const urls: string[] = [];
        for (const file of imageFiles) {
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
            const snap = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snap.ref);
            urls.push(url);
        }
        return urls;
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const partner = partners.find(p => p.id === form.partnerId);
            let imageUrls = [...existingImages];

            // Upload new images
            if (imageFiles.length > 0) {
                try {
                    const newUrls = await uploadImages();
                    imageUrls = [...imageUrls, ...newUrls];
                } catch (imgErr) {
                    console.error('Erro no upload de imagens:', imgErr);
                    // Continue without images if upload fails to not block the whole save
                }
            }

            if (editingId) {
                if (demoMode) {
                    setProducts(prev => prev.map(p => p.id === editingId ? {
                        ...p,
                        name: form.name,
                        brand: form.brand,
                        model: form.model,
                        category: form.category,
                        condition: form.condition,
                        serialNumber: form.serialNumber,
                        price: form.price,
                        images: imageUrls,
                        description: form.description,
                        status: form.status,
                    } : p));
                    setSuccess('Produto atualizado com sucesso! (Modo Demo)');
                } else {
                    await updateDoc(doc(db, 'products', editingId), {
                        name: form.name,
                        brand: form.brand,
                        model: form.model,
                        category: form.category,
                        condition: form.condition,
                        serialNumber: form.serialNumber,
                        price: form.price,
                        images: imageUrls,
                        description: form.description,
                        status: form.status,
                        quantity: Number(form.quantity || 1),
                    });

                    // AUDIT LOG
                    const oldProduct = products.find(p => p.id === editingId);
                    if (oldProduct && oldProduct.status !== form.status) {
                        await addDoc(collection(db, 'logs'), {
                            action: 'UPDATE_PRODUCT_STATUS',
                            productId: editingId,
                            productName: form.name,
                            oldStatus: oldProduct.status,
                            newStatus: form.status,
                            userId: profile?.uid,
                            userName: profile?.name,
                            createdAt: serverTimestamp(),
                        });
                    }
                    setSuccess('Produto atualizado com sucesso!');
                }
            } else {
                if (demoMode) {
                    const newProduct = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: form.name,
                        brand: form.brand,
                        model: form.model,
                        category: form.category,
                        condition: form.condition,
                        serialNumber: form.serialNumber,
                        price: form.price,
                        images: imageUrls,
                        partnerId: form.partnerId,
                        partnerName: partner?.companyName || profile?.name || 'Parceiro Demo',
                        status: 'disponivel',
                        description: form.description,
                        createdAt: new Date(),
                    } as any;
                    setProducts([newProduct, ...products]);
                    setSuccess('Produto cadastrado com sucesso! (Modo Demo)');
                } else {
                    await addDoc(collection(db, 'products'), {
                        name: form.name,
                        brand: form.brand,
                        model: form.model,
                        category: form.category,
                        condition: form.condition,
                        serialNumber: form.serialNumber,
                        price: form.price,
                        images: imageUrls,
                        partnerId: form.partnerId,
                        partnerName: partner?.companyName || profile?.name || '',
                        status: 'disponivel',
                        description: form.description,
                        quantity: Number(form.quantity || 1),
                        createdAt: serverTimestamp(),
                    });

                    // Update partner product count
                    if (form.partnerId && !demoMode) {
                        try {
                            await updateDoc(doc(db, 'partners', form.partnerId), {
                                totalProducts: increment(1),
                            });
                        } catch (pErr) {
                            console.error('Erro ao atualizar contador do parceiro:', pErr);
                        }
                    }

                    setSuccess('Produto cadastrado com sucesso!');
                }
            }

            // Success feedback and UI cleanup
            setSuccess(demoMode ? 'Salvo (Modo Demo)' : 'Salvo com sucesso!');

            if (!demoMode) {
                await fetchData().catch(e => console.error('Erro ao recarregar dados:', e));
            }
            setTimeout(() => {
                setShowModal(false);
                setSuccess('');
            }, 1500);
        } catch (err) {
            setError('Erro ao salvar produto');
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string, name: string, partnerId: string) {
        if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
        try {
            await deleteDoc(doc(db, 'products', id));
            if (partnerId) {
                await updateDoc(doc(db, 'partners', partnerId), {
                    totalProducts: increment(-1),
                });
            }
            await fetchData();
        } catch (err) {
            console.error('Erro ao excluir:', err);
        }
    }

    const filtered = products.filter(p => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand.toLowerCase().includes(search.toLowerCase()) ||
            p.model.toLowerCase().includes(search.toLowerCase()) ||
            p.serialNumber.toLowerCase().includes(search.toLowerCase());
        const matchCategory = !filterCategory || p.category === filterCategory;
        const matchStatus = !filterStatus || p.status === filterStatus;
        const matchCondition = !filterCondition || p.condition === filterCondition;
        return matchSearch && matchCategory && matchStatus && matchCondition;
    });

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
                    <h1 className="page-title">Produtos</h1>
                    <p className="page-subtitle">
                        {isAdmin ? 'Todos os equipamentos cadastrados' : 'Meus equipamentos'}
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/produtos/novo" className="btn-primary">
                        <Plus size={18} />
                        Novo Produto
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-bar" style={{ flex: 1 }}>
                    <Search size={18} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, marca, modelo ou nº série..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="input filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="">Todas Categorias</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    className="input filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Todos Status</option>
                    {statuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                </select>
                <select
                    className="input filter-select"
                    value={filterCondition}
                    onChange={(e) => setFilterCondition(e.target.value)}
                >
                    <option value="">Todos Estados</option>
                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="view-toggle">
                    <button
                        className={`view-btn ${viewMode === 'grid' ? 'view-btn-active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid3X3 size={18} />
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'view-btn-active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Products */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3>{search || filterCategory || filterStatus ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</h3>
                    <p>
                        {search || filterCategory || filterStatus
                            ? 'Tente alterar os filtros'
                            : 'Clique em "Novo Produto" para começar'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="products-grid">
                    {filtered.map((product) => (
                        <div key={product.id} className="card product-card">
                            <div className="product-image">
                                {product.images && product.images.length > 0 ? (
                                    <img src={product.images[0]} alt={product.name} />
                                ) : (
                                    <div className="product-no-image">
                                        <ImageIcon size={32} />
                                    </div>
                                )}
                                <span className={`badge product-status-badge ${getStatusColor(product.status)}`}>
                                    {getStatusLabel(product.status)}
                                </span>
                                {product.quantity > 1 && (
                                    <span className="badge quantity-badge">
                                        {product.quantity} un.
                                    </span>
                                )}
                            </div>
                            <div className="product-body">
                                <div className="product-category-tag">{product.category}</div>
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-detail">{product.brand} {product.model}</p>
                                {isAdmin && <p className="product-partner">{product.partnerName}</p>}
                                <div className="product-footer">
                                    <span className="product-price">{formatCurrency(product.price)}</span>
                                    <div className="product-actions-minimal">
                                        <Link href={`/dashboard/produtos/${product.id}`} className="icon-btn" title="Ver Detalhes">
                                            <Eye size={14} />
                                        </Link>
                                        {isAdmin && (
                                            <>
                                                <button className="icon-btn" onClick={() => openEdit(product)} title="Editar">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(product.id, product.name, product.partnerId)} title="Excluir">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Categoria</th>
                                <th>Estado</th>
                                <th>Preço</th>
                                <th>Qtd</th>
                                <th>Status</th>
                                {isAdmin && <th>Parceiro</th>}
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="table-thumb">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt="" />
                                                ) : (
                                                    <ImageIcon size={16} style={{ color: 'var(--text-muted)' }} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{product.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {product.brand} {product.model}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{product.category}</td>
                                    <td>{product.condition}</td>
                                    <td style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                                    <td>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                                            {product.quantity || 1}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusColor(product.status)}`}>
                                            {getStatusLabel(product.status)}
                                        </span>
                                    </td>
                                    {isAdmin && <td style={{ color: 'var(--text-secondary)' }}>{product.partnerName}</td>}
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <Link href={`/dashboard/produtos/${product.id}`} className="icon-btn"><Eye size={14} /></Link>
                                            {isAdmin && (
                                                <>
                                                    <button className="icon-btn" onClick={() => openEdit(product)}><Edit2 size={14} /></button>
                                                    <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(product.id, product.name, product.partnerId)}><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal glass-strong" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
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

                            {/* Image upload */}
                            <div className="image-upload-section">
                                <label className="label">Fotos do Produto (max 5)</label>
                                <div className="image-upload-grid">
                                    {existingImages.map((url, i) => (
                                        <div key={`existing-${i}`} className="image-thumb">
                                            <img src={url} alt="" />
                                            <button
                                                type="button"
                                                className="image-remove"
                                                onClick={() => removeExistingImage(i)}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {imagePreviews.map((url, i) => (
                                        <div key={`new-${i}`} className="image-thumb">
                                            <img src={url} alt="" />
                                            <button
                                                type="button"
                                                className="image-remove"
                                                onClick={() => removeNewImage(i)}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {(existingImages.length + imagePreviews.length) < 5 && (
                                        <button
                                            type="button"
                                            className="image-upload-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload size={20} />
                                            <span>Adicionar</span>
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    hidden
                                    onChange={handleImageSelect}
                                />
                            </div>

                            <div className="form-grid">
                                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Nome do Equipamento *</label>
                                    <input
                                        className="input"
                                        placeholder="Ex: ONU Huawei EG8141A5"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Marca *</label>
                                    <input
                                        className="input"
                                        placeholder="Ex: Huawei"
                                        value={form.brand}
                                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Modelo</label>
                                    <input
                                        className="input"
                                        placeholder="Ex: EG8141A5"
                                        value={form.model}
                                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Categoria *</label>
                                    <select
                                        className="input"
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="label">Estado de Conservação *</label>
                                    <select
                                        className="input"
                                        value={form.condition}
                                        onChange={(e) => setForm({ ...form, condition: e.target.value as ProductCondition })}
                                    >
                                        {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="label">Nº de Série</label>
                                    <input
                                        className="input"
                                        placeholder="Número de série"
                                        value={form.serialNumber}
                                        onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Preço Unitário (R$) *</label>
                                    <input
                                        className="input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={form.price || ''}
                                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="label">Quantidade em Estoque *</label>
                                    <input
                                        className="input"
                                        type="number"
                                        min="1"
                                        value={form.quantity || 1}
                                        onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                                        required
                                    />
                                </div>

                                {editingId && (
                                    <div className="form-field">
                                        <label className="label">Status Operacional *</label>
                                        <select
                                            className="input"
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
                                        >
                                            {statuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                                        </select>
                                    </div>
                                )}

                                {isAdmin && !editingId && (
                                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Parceiro *</label>
                                        <select
                                            className="input"
                                            value={form.partnerId}
                                            onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecione o parceiro</option>
                                            {partners.map(p => (
                                                <option key={p.id} value={p.id}>{p.companyName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Descrição</label>
                                    <textarea
                                        className="input"
                                        placeholder="Descrição adicional do equipamento..."
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            </div>

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
                                        editingId ? 'Salvar Alterações' : 'Cadastrar Produto'
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

        .filters-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 0 16px;
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
          min-width: 200px;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .filter-select {
          width: auto;
          min-width: 160px;
          padding: 12px 16px;
        }

        .view-toggle {
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          overflow: hidden;
        }

        .view-btn {
          padding: 10px 14px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .view-btn:hover {
          color: var(--text-primary);
        }

        .view-btn-active {
          background: rgba(108, 92, 231, 0.12);
          color: var(--accent-primary);
        }

        /* Products grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .product-card {
          overflow: hidden;
          padding: 0;
        }

        .product-image {
          position: relative;
          height: 180px;
          background: var(--bg-elevated);
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-no-image {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .product-status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
        }

        .product-body {
          padding: 20px;
        }

        .product-category-tag {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .product-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .product-detail {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .product-partner {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
          margin-top: 12px;
        }

        .product-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--success);
        }

        .product-actions-mini {
          display: flex;
          gap: 4px;
        }

        .icon-btn {
          padding: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(108, 92, 231, 0.1);
          color: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .icon-btn-danger:hover {
          background: rgba(255, 107, 107, 0.1);
          color: var(--danger);
          border-color: var(--danger);
        }

        .table-thumb {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--bg-elevated);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .table-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Image upload */
        .image-upload-section {
          margin-bottom: 8px;
        }

        .image-upload-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .image-thumb {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 1px solid var(--border-primary);
        }

        .image-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 107, 107, 0.9);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-upload-btn {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          border: 2px dashed var(--border-primary);
          background: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 10px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }

        .image-upload-btn:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
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
          max-width: 680px;
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

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
          }

          .filter-select {
            width: 100%;
          }

          .search-bar {
            width: 100%;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-grid .form-field[style*="grid-column"] {
            grid-column: span 1 !important;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
