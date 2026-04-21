'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Sale } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
    ArrowLeft,
    Calendar,
    Tag,
    Hash,
    ShieldCheck,
    Truck,
    Edit2,
    Image as ImageIcon,
    Loader2,
    Package,
    Navigation,
    Info,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { profile, isAdmin, demoMode } = useAuth();
    const { isFirebaseConfigured } = require('@/lib/firebase');

    const [product, setProduct] = useState<Product | null>(null);
    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        async function fetchProductData() {
            if (!isFirebaseConfigured || demoMode) {
                // Mock data for demo
                const mockProduct: Product = {
                    id: id as string,
                    name: 'ONU Huawei EG8141A5',
                    brand: 'Huawei',
                    model: 'EG8141A5 1GE+3FE+1POTS+WiFi',
                    category: 'ONU',
                    condition: 'Usado',
                    serialNumber: 'HW1234567890ABC',
                    price: 150.00,
                    images: [
                        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1000',
                        'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=1000'
                    ],
                    partnerId: 'partner123',
                    partnerName: 'NetLink Telecom',
                    status: 'disponivel',
                    quantity: 10,
                    description: 'Equipamento testado e higienizado. Acompanha fonte de alimentação original. Ideal para redes GPON.',
                    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                };
                setProduct(mockProduct);
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'products', id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const prod = {
                        id: docSnap.id,
                        ...data,
                        createdAt: data.createdAt?.toDate?.() || new Date(),
                    } as Product;

                    // Security check: Partners can only see their own products
                    if (!isAdmin && profile?.partnerId !== prod.partnerId) {
                        router.push('/dashboard/produtos');
                        return;
                    }

                    setProduct(prod);

                    // If sold, fetch sale info
                    if (prod.status === 'vendido') {
                        const salesQuery = query(
                            collection(db, 'sales'),
                            where('productId', '==', id),
                            orderBy('createdAt', 'desc'),
                            limit(1)
                        );
                        const saleSnap = await getDocs(salesQuery);
                        if (!saleSnap.empty) {
                            setSale({
                                id: saleSnap.docs[0].id,
                                ...saleSnap.docs[0].data(),
                                saleDate: saleSnap.docs[0].data().saleDate?.toDate?.() || new Date(),
                            } as Sale);
                        }
                    }
                } else {
                    router.push('/dashboard/produtos');
                }
            } catch (error) {
                console.error('Erro ao buscar produto:', error);
            } finally {
                setLoading(false);
            }
        }

        if (profile) fetchProductData();
    }, [id, profile, isAdmin, isFirebaseConfigured, demoMode, router]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="product-detail-page animate-fade-in">
            {/* Header / Breadcrumb */}
            <div className="breadcrumb">
                <Link href="/dashboard/produtos" className="back-link">
                    <ArrowLeft size={18} />
                    <span>Voltar para Produtos</span>
                </Link>
            </div>

            <div className="detail-layout">
                {/* Left Side: Images */}
                <div className="gallery-section">
                    <div className="main-image-container glass-strong">
                        {product.images && product.images.length > 0 ? (
                            <img src={product.images[activeImage]} alt={product.name} className="main-image" />
                        ) : (
                            <div className="no-image-placeholder">
                                <ImageIcon size={64} style={{ color: 'var(--text-muted)' }} />
                                <span>Sem imagens disponíveis</span>
                            </div>
                        )}
                        <div className={`badge status-overlay ${getStatusColor(product.status)}`}>
                            {getStatusLabel(product.status)}
                        </div>
                    </div>

                    {product.images && product.images.length > 1 && (
                        <div className="thumbnails-grid">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    className={`thumb-btn ${activeImage === idx ? 'active' : ''}`}
                                    onClick={() => setActiveImage(idx)}
                                >
                                    <img src={img} alt="" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="info-card glass-strong">
                        <h3 className="card-title"><Info size={18} /> Descrição Técnica</h3>
                        <p className="description-text">
                            {product.description || 'Nenhuma descrição detalhada fornecida para este equipamento.'}
                        </p>
                    </div>
                </div>

                {/* Right Side: Info */}
                <div className="info-section">
                    <div className="product-header-info">
                        <div className="category-tag">{product.category}</div>
                        <h1 className="product-name">{product.name}</h1>
                        <div className="brand-model">{product.brand} • {product.model}</div>
                    </div>

                    <div className="price-box glass-strong">
                        <div className="price-label">Preço Sugerido</div>
                        <div className="price-value">{formatCurrency(product.price)}</div>
                        <button className="btn-primary" style={{ width: '100%', marginTop: 20 }}>
                            <Edit2 size={18} /> Editar Produto
                        </button>
                    </div>

                    <div className="specs-grid">
                        <div className="spec-item glass-strong">
                            <div className="spec-icon"><Hash size={18} /></div>
                            <div className="spec-content">
                                <div className="spec-label">Nº de Série</div>
                                <div className="spec-value">{product.serialNumber || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="spec-item glass-strong">
                            <div className="spec-icon"><ShieldCheck size={18} /></div>
                            <div className="spec-content">
                                <div className="spec-label">Estado</div>
                                <div className="spec-value">{product.condition}</div>
                            </div>
                        </div>

                        <div className="spec-item glass-strong">
                            <div className="spec-icon"><Calendar size={18} /></div>
                            <div className="spec-content">
                                <div className="spec-label">Cadastrado em</div>
                                <div className="spec-value">{formatDate(product.createdAt)}</div>
                            </div>
                        </div>

                        <div className="spec-item glass-strong">
                            <div className="spec-icon"><Navigation size={18} /></div>
                            <div className="spec-content">
                                <div className="spec-label">Parceiro</div>
                                <div className="spec-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                                    <Link href={`/dashboard/parceiros/${product.partnerId}`}>
                                        {product.partnerName}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="spec-item glass-strong">
                            <div className="spec-icon"><Package size={18} /></div>
                            <div className="spec-content">
                                <div className="spec-label">Quantidade em Estoque</div>
                                <div className="spec-value">{product.quantity || 1} unidades</div>
                            </div>
                        </div>
                    </div>

                    {/* Sale Info (if sold) */}
                    {product.status === 'vendido' && sale && (
                        <div className="sale-info-card glass-strong animate-slide-up">
                            <div className="card-header-with-icon">
                                <div className="card-icon-round" style={{ background: 'rgba(0, 184, 148, 0.12)', color: '#00b894' }}>
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <h3 className="card-title" style={{ margin: 0 }}>Detalhes da Venda</h3>
                                    <p className="card-subtitle">Vendido via {sale.marketplace}</p>
                                </div>
                            </div>

                            <div className="sale-details-list">
                                <div className="sale-detail">
                                    <span>Comprador:</span>
                                    <strong>{sale.buyerName || 'Não informado'}</strong>
                                </div>
                                <div className="sale-detail">
                                    <span>Data da Venda:</span>
                                    <strong>{formatDate(sale.saleDate)}</strong>
                                </div>
                                <div className="sale-detail">
                                    <span>Valor Bruto:</span>
                                    <strong style={{ color: 'var(--success)' }}>{formatCurrency(sale.salePrice)}</strong>
                                </div>
                                <div className="sale-detail">
                                    <span>Comissão ({sale.commissionRate}%):</span>
                                    <strong style={{ color: 'var(--danger)' }}>{formatCurrency(sale.commissionValue)}</strong>
                                </div>
                                <div className="divider" />
                                <div className="sale-detail total">
                                    <span>Repasse Líquido:</span>
                                    <strong>{formatCurrency(sale.partnerValue)}</strong>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .product-detail-page {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .breadcrumb { margin-bottom: 24px; }
                .back-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary);
                    font-size: 14px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .back-link:hover { color: var(--accent-primary); }

                .detail-layout {
                    display: grid;
                    grid-template-columns: 1fr 450px;
                    gap: 32px;
                }

                /* Gallery section */
                .gallery-section { display: flex; flex-direction: column; gap: 20px; }
                
                .main-image-container {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    border-radius: 24px;
                    overflow: hidden;
                    background: var(--bg-card);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--border-primary);
                }

                .main-image { width: 100%; height: 100%; object-fit: contain; }
                
                .no-image-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    color: var(--text-muted);
                }

                .status-overlay {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    padding: 8px 16px;
                    font-size: 12px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .thumbnails-grid {
                    display: flex;
                    gap: 12px;
                }

                .thumb-btn {
                    width: 80px;
                    height: 80px;
                    border-radius: 12px;
                    border: 2px solid transparent;
                    background: var(--bg-card);
                    overflow: hidden;
                    cursor: pointer;
                    padding: 0;
                    transition: border-color 0.2s;
                }
                .thumb-btn.active { border-color: var(--accent-primary); }
                .thumb-btn img { width: 100%; height: 100%; object-fit: cover; }

                /* Info Section */
                .info-section { display: flex; flex-direction: column; gap: 24px; }

                .category-tag {
                    display: inline-block;
                    padding: 4px 12px;
                    background: rgba(108, 92, 231, 0.1);
                    color: var(--accent-primary);
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }

                .product-name { font-size: 32px; font-weight: 900; letter-spacing: -1px; line-height: 1.1; margin-bottom: 8px; }
                .brand-model { font-size: 18px; color: var(--text-secondary); margin-bottom: 10px; }

                .price-box {
                    padding: 30px;
                    border-radius: 24px;
                    text-align: center;
                }
                .price-label { font-size: 14px; color: var(--text-muted); margin-bottom: 4px; }
                .price-value { font-size: 42px; font-weight: 900; color: var(--accent-primary); letter-spacing: -1.5px; }

                .specs-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .spec-item {
                    padding: 16px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .spec-icon { color: var(--accent-primary); }
                .spec-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                .spec-value { font-size: 14px; font-weight: 600; }

                .info-card { padding: 24px; border-radius: 20px; }
                .card-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
                .description-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }

                /* Sale Card */
                .sale-info-card {
                    padding: 24px;
                    border-radius: 24px;
                    border-left: 4px solid var(--success);
                }
                .card-header-with-icon { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
                .card-icon-round { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .card-subtitle { font-size: 13px; color: var(--text-muted); }

                .sale-details-list { display: flex; flex-direction: column; gap: 10px; }
                .sale-detail { display: flex; justify-content: space-between; font-size: 14px; }
                .sale-detail span { color: var(--text-secondary); }
                .divider { height: 1px; background: var(--border-primary); margin: 6px 0; }
                .sale-detail.total { font-size: 16px; font-weight: 800; border-top: 1px solid var(--border-primary); padding-top: 12px; margin-top: 4px; }

                @media (max-width: 1024px) {
                    .detail-layout { grid-template-columns: 1fr; }
                    .info-section { order: -1; }
                }
            `}</style>
        </div>
    );
}
