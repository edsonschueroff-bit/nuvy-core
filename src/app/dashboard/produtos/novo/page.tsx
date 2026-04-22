import { Suspense } from 'react';
import NovoProdutoPageClient from './page-client';

export default function NovoProdutoPage() {
    return (
        <Suspense fallback={null}>
            <NovoProdutoPageClient />
        </Suspense>
    );
}
