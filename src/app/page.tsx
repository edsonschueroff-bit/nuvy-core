'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, profile, loading, demoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user || demoMode) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router, demoMode]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 16px', display: 'block' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Carregando...</p>
      </div>
    </div>
  );
}
