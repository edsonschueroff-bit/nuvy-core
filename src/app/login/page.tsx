'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, AlertCircle, Shield, Building2, Terminal, Cpu, Network } from 'lucide-react';

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
    <div className="login-split-container">
      {/* Esquerda: Marketing B2B SaaS Premium */}
      <div className="login-marketing">
        <div className="marketing-bg-effects">
          <div className="marketing-orb orb-1" />
          <div className="marketing-orb orb-2" />
          <div className="marketing-grid" />
        </div>

        <div className="marketing-content animate-slide-in">
          <div className="brand-badge">Enterprise Edition</div>
          <h1 className="marketing-title">
            O hub definitivo da<br />sua infraestrutura.
          </h1>
          <p className="marketing-subtitle">
            Plataforma escalável para gestão unificada de ativos de telecom. Controle rigoroso, transações seguras e dados em tempo real para ISPs exigentes.
          </p>

          <div className="marketing-features">
            <div className="feature-item">
              <div className="feature-icon"><Terminal size={20} /></div>
              <div>
                <h4>API Pronta</h4>
                <p>Integrações ágeis e controle absoluto por código.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Network size={20} /></div>
              <div>
                <h4>Escala Global</h4>
                <p>Arquitetura cloud fluida para múltiplos provedores.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Cpu size={20} /></div>
              <div>
                <h4>Core Inteligente</h4>
                <p>Motor de análise logistica sem atritos (frictionless).</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direita: Formulário de Login */}
      <div className="login-form-container">
        <div className="login-form-wrapper animate-fade-in">
          {/* Logo Mobile ou Desktop Secundária */}
          <div className="login-logo">
            <div className="login-logo-img">
              <img src="/logo.png" alt="Nuvy Core Logo" />
            </div>
            <h1 className="login-brand-name">
              Nuvy <span className="gradient-text">Core</span>
            </h1>
          </div>

          <div className="login-form-header">
            <h2>Bem-vindo de volta</h2>
            <p>Acesse seu painel executivo para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error slide-down">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {!isConfigured && (
              <div className="login-demo-notice slide-down">
                <AlertCircle size={16} />
                <span>Modo Demonstração Habilitado (Sem Firebase)</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email" className="label">E-mail corporativo</label>
              <input
                id="email"
                type="email"
                className="input premium-input"
                placeholder="admin@provedor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={isConfigured}
                disabled={isLoading || !isConfigured}
              />
            </div>

            <div className="login-field">
              <div className="password-header">
                <label htmlFor="password" className="label">Senha</label>
                <a href="#" className="forgot-password">Esqueceu a senha?</a>
              </div>
              <div className="login-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input premium-input"
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
                    Autenticando...
                  </>
                ) : (
                  'Acessar Sistema'
                )}
              </button>
            )}

            {/* Demo Mode Section */}
            {!isConfigured && (
              <div className="login-demo-section">
                <div className="login-demo-divider">
                  <span>Ou explore o sistema</span>
                </div>
                <div className="login-demo-buttons">
                  <button
                    type="button"
                    className="login-demo-btn login-demo-admin"
                    onClick={() => handleDemoLogin('admin')}
                  >
                    <Shield size={20} className="demo-icon" />
                    <div className="demo-texts">
                      <span className="demo-btn-title">Área do Administrador</span>
                      <span className="demo-btn-desc">Painel central de comando</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="login-demo-btn login-demo-partner"
                    onClick={() => handleDemoLogin('parceiro')}
                  >
                    <Building2 size={20} className="demo-icon" />
                    <div className="demo-texts">
                      <span className="demo-btn-title">Visão do Parceiro (ISP)</span>
                      <span className="demo-btn-desc">Controle de ponta e comissões</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="login-footer">
            Ao acessar, você concorda com nossos <br />Termos de Cloud e Política de Privacidade.<br />
            <span>© 2026 Nuvy Core</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        /* Container Principal Split Screen */
        .login-split-container {
          display: flex;
          min-height: 100vh;
          background-color: #050508;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }

        /* ---------------- Left Side: Marketing ---------------- */
        .login-marketing {
          flex: 1.2;
          position: relative;
          display: none;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          background: #0a0a0f;
          border-right: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }

        @media (min-width: 1024px) {
          .login-marketing {
            display: flex;
          }
        }

        .marketing-bg-effects {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .marketing-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.25;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: #00cec9;
          top: -100px;
          left: -200px;
          animation: floatOrb 15s ease-in-out infinite;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: #6c5ce7;
          bottom: -150px;
          right: -100px;
          animation: floatOrb 12s ease-in-out infinite reverse;
        }

        .marketing-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
          -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
        }

        .marketing-content {
          position: relative;
          z-index: 1;
          max-width: 520px;
        }

        .brand-badge {
          display: inline-block;
          padding: 6px 14px;
          background: rgba(108, 92, 231, 0.15);
          border: 1px solid rgba(108, 92, 231, 0.3);
          color: #a29bfe;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border-radius: 20px;
          margin-bottom: 24px;
          box-shadow: 0 0 20px rgba(108, 92, 231, 0.2);
        }

        .marketing-title {
          font-size: 46px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -1.5px;
          color: #ffffff;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #fff 0%, #a29bfe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .marketing-subtitle {
          font-size: 16px;
          line-height: 1.6;
          color: #8888a0;
          margin-bottom: 48px;
        }

        .marketing-features {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(0, 206, 201, 0.1);
          color: #00cec9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(0, 206, 201, 0.2);
        }

        .feature-item h4 {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .feature-item p {
          font-size: 13px;
          color: #6a6a80;
          line-height: 1.4;
        }


        /* ---------------- Right Side: Form ---------------- */
        .login-form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          background: #0a0a0f;
          position: relative;
        }

        /* Mobile specific background for right side */
        @media (max-width: 1023px) {
          .login-form-container {
            background-image: 
              radial-gradient(circle at 100% 0%, rgba(108, 92, 231, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 0% 100%, rgba(0, 206, 201, 0.05) 0%, transparent 40%);
          }
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 400px;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }

        .login-logo-img {
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 6px;
        }

        .login-logo-img img {
          width: 100%;
          height: auto;
        }

        .login-brand-name {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -1px;
          color: #fff;
        }

        .gradient-text {
          background: linear-gradient(135deg, #6c5ce7, #00cec9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-form-header {
          margin-bottom: 32px;
        }

        .login-form-header h2 {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .login-form-header p {
          color: #8888a0;
          font-size: 15px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .password-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-password {
          font-size: 12px;
          color: #6c5ce7;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .forgot-password:hover {
          color: #8c7cf7;
        }

        .label {
          font-size: 13px;
          font-weight: 600;
          color: #b0b0c0;
        }

        .premium-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 14px 16px;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          transition: all 0.2s ease;
        }

        .premium-input:focus {
          background: rgba(255,255,255,0.05);
          border-color: #6c5ce7;
          box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.15);
          outline: none;
        }

        .login-password-wrapper {
          position: relative;
        }

        .login-password-wrapper .premium-input {
          width: 100%;
          padding-right: 45px;
        }

        .login-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6a6a80;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.2s;
        }

        .login-password-toggle:hover {
          color: #a29bfe;
        }

        .login-submit {
          margin-top: 8px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 12px;
          background: linear-gradient(135deg, #6c5ce7, #5b4dd4);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(108, 92, 231, 0.2);
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(108, 92, 231, 0.3);
        }

        /* Errors and Notices */
        .login-error, .login-demo-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .login-error {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
        }

        .login-demo-notice {
          background: rgba(253, 203, 110, 0.1);
          border: 1px solid rgba(253, 203, 110, 0.2);
          color: #fdcb6e;
        }

        /* Demo Buttons Section */
        .login-demo-section {
          margin-top: 16px;
        }

        .login-demo-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin-bottom: 24px;
          color: #5a5a70;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .login-demo-divider::before, .login-demo-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .login-demo-divider span {
          padding: 0 16px;
          font-weight: 600;
        }

        .login-demo-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .login-demo-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
        }

        .login-demo-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
          transform: translateX(4px);
        }

        .demo-icon {
          color: #a29bfe;
        }

        .login-demo-partner .demo-icon {
          color: #00cec9;
        }

        .demo-texts {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .demo-btn-title {
          color: #fff;
          font-size: 14px;
          font-weight: 700;
        }

        .demo-btn-desc {
          color: #6a6a80;
          font-size: 12px;
        }

        .login-footer {
          margin-top: 48px;
          text-align: center;
          font-size: 12px;
          color: #5a5a70;
          line-height: 1.6;
        }

        .login-footer span {
          display: block;
          margin-top: 12px;
          font-weight: 600;
          color: #8888a0;
        }

        /* Animations */
        @keyframes floatOrb {
          0% { transform: translate(0, 0); }
          50% { transform: translate(30px, 30px); }
          100% { transform: translate(0, 0); }
        }

        .animate-slide-in {
          animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
