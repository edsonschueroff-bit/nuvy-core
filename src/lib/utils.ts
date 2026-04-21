import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(' ');
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

export function formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        disponivel: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        anunciado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        vendido: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        devolvido: 'bg-red-500/10 text-red-400 border-red-500/20',
        pendente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        enviado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        entregue: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        realizado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        manutencao: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        reservado: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        disponivel: 'Disponível',
        anunciado: 'Anunciado',
        vendido: 'Vendido',
        devolvido: 'Devolvido',
        pendente: 'Pendente',
        enviado: 'Enviado',
        entregue: 'Entregue',
        realizado: 'Realizado',
        manutencao: 'Em Manutenção',
        reservado: 'Reservado',
    };
    return labels[status] || status;
}
