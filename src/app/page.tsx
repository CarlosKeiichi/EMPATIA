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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-12 flex-col justify-between text-white">
        <div className="flex items-center gap-4">
          <Logo size={48} />
          <div>
            <h1 className="text-3xl font-bold">EmpatIA</h1>
            <p className="text-purple-300 mt-0.5 text-sm">Saúde Mental do Professor</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Jornada Conversacional</h3>
              <p className="text-purple-200/70 text-sm">Converse com a Márcia, nossa IA acolhedora, e explore seus sentimentos de forma segura.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Diagnóstico Personalizado</h3>
              <p className="text-purple-200/70 text-sm">Receba um retrato emocional com recomendações práticas para seu bem-estar.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-lg">🔒</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Sigilo Garantido</h3>
              <p className="text-purple-200/70 text-sm">Suas respostas são anonimizadas. Ninguém verá seus dados individuais.</p>
            </div>
          </div>
        </div>

        <p className="text-purple-400/50 text-xs">EmpatIA — Desenvolvido com cuidado para quem cuida.</p>
      </div>

      {/* Lado direito - login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Logo size={48} showText />
            <p className="text-gray-500 mt-1 text-sm">Saúde Mental do Professor</p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Entrar na plataforma</h2>
            <p className="text-gray-500 text-sm mb-6">Use suas credenciais para acessar</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
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
                <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{erro}</div>
              )}

              <button type="submit" className="btn-primary w-full bg-[#7c6bab] hover:bg-[#6b5a9a]" disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Primeiro acesso?{' '}
                <a href="/cadastro" className="text-[#7c6bab] font-medium hover:underline">
                  Cadastre-se aqui
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Ao entrar, você concorda com nossos termos de privacidade e uso ético dos dados.
          </p>
        </div>
      </div>
    </div>
  );
}
