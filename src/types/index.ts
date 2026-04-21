export type UserRole = 'admin' | 'parceiro';

export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    partnerId?: string;
    createdAt: Date;
}

export interface Partner {
    id: string;
    companyName: string;
    cnpj: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
    commissionRate: number;
    totalProducts: number;
    totalSold: number;
    totalRevenue: number;
    isActive: boolean;
    createdAt: Date;
}

export type ProductCategory = 'OLT' | 'ONU' | 'Switch' | 'Roteador' | 'Cabo' | 'Outros';
export type ProductCondition = 'Novo' | 'Semi-novo' | 'Usado' | 'Para peças';
export type ProductStatus = 'disponivel' | 'anunciado' | 'vendido' | 'devolvido' | 'manutencao' | 'reservado';

export interface Product {
    id: string;
    name: string;
    brand: string;
    model: string;
    category: ProductCategory;
    condition: ProductCondition;
    serialNumber: string;
    price: number;
    images: string[];
    partnerId: string;
    partnerName: string;
    status: ProductStatus;
    quantity: number;
    marketplace?: string;
    description?: string;
    createdAt: Date;
}

export type SaleStatus = 'pendente' | 'enviado' | 'entregue' | 'devolvido';

export interface Sale {
    id: string;
    productId: string;
    productName: string;
    partnerId: string;
    partnerName: string;
    marketplace: string;
    salePrice: number;
    commissionRate: number;
    commissionValue: number;
    partnerValue: number;
    buyerName: string;
    status: SaleStatus;
    saleDate: Date;
    transferId?: string;
    createdAt: Date;
}

export type TransferStatus = 'pendente' | 'realizado';

export interface Transfer {
    id: string;
    partnerId: string;
    partnerName: string;
    amount: number;
    salesIds: string[];
    status: TransferStatus;
    transferDate?: Date;
    evidenceUrl?: string;
    createdAt: Date;
}
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    read: boolean;
    createdAt: Date;
}
