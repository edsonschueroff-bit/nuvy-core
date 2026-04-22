'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Garantimos que o firebase é iniciado no Node sem conflitos de memória
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA5mrqg_DCHPHfAEreWAs99sX7VmXr3vzE',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'equipanet-ab9f4',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Tipagem do DTO (Data Transfer Object) da Venda
export interface CreateSaleInput {
    productId: string;
    marketplace: string;
    salePrice: number;
    buyerName: string;
    adminId: string; // Para notificação e logs
}

/**
 * SERVER ACTION: createSaleTransaction
 * Roda exclusivamente no servidor Node do Next.js (segurança total)
 * O parceiro não tem acesso a essa lógica no navegador.
 */
export async function createSaleTransaction(input: CreateSaleInput) {
    try {
        // 1. O BACKEND FECHA OS OLHOS PARA O CLIENTE E CONSULTA A FONTE DA VERDADE
        const productRef = doc(db, 'products', input.productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            throw new Error('Produto não encontrado no banco de dados.');
        }

        const product = productSnap.data();

        // 2. VALIDAÇÃO CÍTRICA DE DISPONIBILIDADE
        if (product.status !== 'disponivel' && product.status !== 'anunciado') {
            throw new Error('Manipulação detectada: Este produto já não está mais disponível.');
        }

        // 3. O BACKEND DESCobre A TAXA DE COMISSÃO DIRETAMENTE DO DOC DO PARCEIRO
        // Isso impede que o navegador envie "Taxa de 0%" num ataque hacker
        const partnerRef = doc(db, 'partners', product.partnerId);
        const partnerSnap = await getDoc(partnerRef);

        // Se não achar o parceiro, cobra taxa cheia (20%) por padrão de segurança
        const commissionRate = partnerSnap.exists() ? partnerSnap.data().commissionRate : 20;

        // 4. A MATEMÁTICA FINANCEIRA RODA NO SERVIDOR (INTOCÁVEL)
        const commissionValue = input.salePrice * (commissionRate / 100);
        const partnerValue = input.salePrice - commissionValue;

        // 5. REGISTRA A VENDA OFICIAL
        // Neste estágio o cliente não tem poder de alterar nenhum valor final
        const saleData = {
            productId: productSnap.id,
            productName: product.name,
            partnerId: product.partnerId,
            partnerName: product.partnerName || 'Desconhecido',
            marketplace: input.marketplace,
            salePrice: input.salePrice,
            commissionRate,
            commissionValue,
            partnerValue,
            buyerName: input.buyerName,
            status: 'pendente',
            saleDate: serverTimestamp(),
            createdAt: serverTimestamp(),
        };

        const saleRef = await addDoc(collection(db, 'sales'), saleData);

        // 6. PROCESSAMENTO DO ESTOQUE (Baixa em Lote) E LOG DE AUDITORIA
        const currentQuantity = product.quantity || 1;
        const newQuantity = currentQuantity - 1;

        const productUpdates: any = {
            quantity: newQuantity,
            updatedAt: serverTimestamp()
        };

        if (newQuantity <= 0) {
            productUpdates.status = 'vendido';
        }

        // O Backend faz o UPDATE (Cliente não roda este código)
        await updateDoc(productRef, productUpdates);

        // 7. Salva o LOG DE AUDITORIA SILENCIOSO (novo recurso extra de segurança)
        await addDoc(collection(db, 'audit_logs'), {
            action: 'SALE_COMPLETED',
            entityId: saleRef.id,
            entityType: 'sale',
            description: `Produto ${product.name} esgotou em 1 unidade. Estoque restando: ${newQuantity}.`,
            ipAssumed: 'server_action',
            createdAt: serverTimestamp()
        });

        // 8. CRIA A TRANSAÇÃO FINANCEIRA (LIVRO CAIXA)
        await addDoc(collection(db, 'transactions'), {
            type: 'SALE',
            partnerId: product.partnerId,
            partnerName: product.partnerName || 'Desconhecido',
            productId: productSnap.id,
            productName: product.name,
            grossValue: input.salePrice,
            commissionValue: commissionValue,
            netPartnerValue: partnerValue,
            description: `Venda via ${input.marketplace} - Comprador: ${input.buyerName} (Seguro)`,
            createdAt: serverTimestamp(),
        });

        // 9. ATUALIZA MÉTRICAS DO PARCEIRO
        const { increment } = await import('firebase/firestore');
        await updateDoc(partnerRef, {
            totalSold: increment(1)
        });

        return {
            success: true,
            saleId: saleRef.id,
            message: 'Venda aprovada e auditada pelo Servidor com sucesso.'
        };

    } catch (error: any) {
        console.error('SERVER ACTION ERROR:', error);
        return {
            success: false,
            message: error.message || 'Falha catastrófica de validação no Servidor.'
        };
    }
}
