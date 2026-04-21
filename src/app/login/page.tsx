'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Wifi, Eye, EyeOff, Loader2, AlertCircle, Shield, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isConfigured, enableDemoMode } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      if (errorMessage.includes('user-not-found') || errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        setError('Email ou senha incorretos');
      } else if (errorMessage.includes('too-many-requests')) {
        setError('Muitas tentativas. Tente novamente em alguns minutos');
      } else if (errorMessage.includes('não configurado') || errorMessage.includes('demo')) {
        setError('Firebase não configurado. Use o modo demo abaixo.');
      } else {
        setError('Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'parceiro') => {
    enableDemoMode(role);
    router.push('/dashboard');
  };

  return (
    <div className="login-container">
      {/* Background effects */}
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-grid" />
      </div>

      <div className="login-content animate-fade-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-img">
            <img src="/logo.png" alt="Nuvy Core Logo" />
          </div>
          <h1 className="login-title">
            Nuvy <span className="gradient-text">Core</span>
          </h1>
          <p className="login-subtitle">
            Gestão de Ativos e Logística de Redes
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form glass-strong">
          <div className="login-form-header">
            <h2>Entrar na plataforma</h2>
            <p>Use suas credenciais para acessar</p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!isConfigured && (
            <div className="login-demo-notice">
              <AlertCircle size={16} />
              <span>Firebase não configurado — use o modo demo para explorar o sistema</span>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={isConfigured}
              disabled={isLoading || !isConfigured}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="label">Senha</label>
            <div className="login-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={isConfigured}
                disabled={isLoading || !isConfigured}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isConfigured && (
            <button
              type="submit"
              className="btn-primary login-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          )}

          {/* Demo Mode Buttons */}
          {!isConfigured && (
            <div className="login-demo-section">
              <div className="login-demo-divider">
                <span>Modo Demonstração</span>
              </div>
              <div className="login-demo-buttons">
                <button
                  type="button"
                  className="login-demo-btn login-demo-admin"
                  onClick={() => handleDemoLogin('admin')}
                >
                  <Shield size={20} />
                  <div>
                    <span className="login-demo-btn-title">Entrar como Admin</span>
                    <span className="login-demo-btn-desc">Acesso completo ao sistema</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="login-demo-btn login-demo-partner"
                  onClick={() => handleDemoLogin('parceiro')}
                >
                  <Building2 size={20} />
                  <div>
                    <span className="login-demo-btn-title">Entrar como Parceiro</span>
                    <span className="login-demo-btn-desc">Visão restrita de parceiro</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="login-footer">
          © 2026 Nuvy Core — Logística de Confiabilidade
        </p>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .login-bg-effects {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
        }

        .login-orb-1 {
          width: 500px;
          height: 500px;
          background: #6c5ce7;
          top: -150px;
          right: -100px;
          animation: float 8s ease-in-out infinite;
        }

        .login-orb-2 {
          width: 400px;
          height: 400px;
          background: #00cec9;
          bottom: -100px;
          left: -100px;
          animation: float 10s ease-in-out infinite reverse;
        }

        .login-orb-3 {
          width: 300px;
          height: 300px;
          background: #fd79a8;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: float 12s ease-in-out infinite;
        }

        .login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .login-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .login-logo {
          text-align: center;
        }

        .login-logo-img {
          width: 250px;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          animation: float 4s ease-in-out infinite;
        }

        .login-logo-img img {
          width: 100%;
          height: auto;
          filter: drop-shadow(0 0 20px rgba(108, 92, 231, 0.4));
        }

        .login-title {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .login-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 400;
        }

        .login-form {
          width: 100%;
          padding: 36px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-form-header {
          text-align: center;
        }

        .login-form-header h2 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .login-form-header p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: var(--danger);
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .login-demo-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(108, 92, 231, 0.1);
          border: 1px solid rgba(108, 92, 231, 0.2);
          color: var(--accent-primary);
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .login-field {
          display: flex;
          flex-direction: column;
        }

        .login-password-wrapper {
          position: relative;
        }

        .login-password-wrapper .input {
          padding-right: 44px;
        }

        .login-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .login-password-toggle:hover {
          color: var(--text-primary);
        }

        .login-submit {
          width: 100%;
          justify-content: center;
          padding: 14px 24px;
          font-size: 15px;
          margin-top: 4px;
        }

        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Demo section */
        .login-demo-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-demo-divider {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .login-demo-divider::before,
        .login-demo-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-primary);
        }

        .login-demo-divider span {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
          white-space: nowrap;
        }

        .login-demo-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .login-demo-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 14px;
          border: 1px solid var(--border-primary);
          background: var(--bg-elevated);
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          width: 100%;
          font-family: 'Inter', sans-serif;
        }

        .login-demo-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .login-demo-admin {
          color: var(--accent-primary);
        }

        .login-demo-admin:hover {
          border-color: var(--accent-primary);
          background: rgba(108, 92, 231, 0.08);
        }

        .login-demo-partner {
          color: var(--accent-secondary);
        }

        .login-demo-partner:hover {
          border-color: var(--accent-secondary);
          background: rgba(0, 206, 201, 0.08);
        }

        .login-demo-btn-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .login-demo-btn-desc {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
        }

        .login-footer {
          font-size: 12px;
          color: var(--text-muted);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
