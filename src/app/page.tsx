'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao fazer login');
        return;
      }

      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        router.push('/admin');
      } else {
        router.push('/professor');
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - branding EmpatIA */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Organic background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-breathe" />
          <div className="absolute top-1/2 -right-20 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-primary-300/5 rounded-full blur-3xl animate-breathe" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 animate-fade-in">
          <Logo size={100} showText variant="light" />
        </div>

        <div className="relative z-10 space-y-8 stagger-children">
          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 shadow-warm-sm group-hover:bg-white/15 transition-colors duration-300">
              <span className="text-xl">💬</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white/95">Jornada Conversacional</h3>
              <p className="text-primary-200/70 text-sm leading-relaxed mt-1">Converse com a Marcia, nossa IA acolhedora, e explore seus sentimentos de forma segura.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 shadow-warm-sm group-hover:bg-white/15 transition-colors duration-300">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white/95">Diagnostico Personalizado</h3>
              <p className="text-primary-200/70 text-sm leading-relaxed mt-1">Receba um retrato emocional com recomendacoes praticas para seu bem-estar.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 shadow-warm-sm group-hover:bg-white/15 transition-colors duration-300">
              <span className="text-xl">🔒</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white/95">Sigilo Garantido</h3>
              <p className="text-primary-200/70 text-sm leading-relaxed mt-1">Suas respostas sao anonimizadas. Ninguem vera seus dados individuais.</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-primary-300/40 text-xs font-medium animate-fade-in" style={{ animationDelay: '1.2s' }}>
          EmpatIA — Desenvolvido com cuidado para quem cuida.
        </p>
      </div>

      {/* Lado direito - login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-warm-50 bg-organic relative">
        {/* Subtle warm decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-50/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Logo mobile */}
          <div className="lg:hidden mb-10 flex justify-center animate-slide-up">
            <Logo size={48} showText />
          </div>

          <div className="card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-warm-800">Bem-vindo de volta</h2>
              <p className="text-warm-500 text-sm mt-1">Entre para continuar sua jornada de bem-estar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Senha</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              {erro && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl border border-red-100 animate-fade-in">
                  {erro}
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={carregando}>
                {carregando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </span>
                ) : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-primary-50 text-center">
              <p className="text-sm text-warm-500">
                Primeiro acesso?{' '}
                <a href="/cadastro" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                  Cadastre-se aqui
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-warm-400 mt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Ao entrar, voce concorda com nossos termos de privacidade e uso etico dos dados.
          </p>
        </div>
      </div>
    </div>
  );
}
