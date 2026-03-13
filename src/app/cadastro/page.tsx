'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const generos = [
  { valor: 'feminino', label: 'Feminino' },
  { valor: 'masculino', label: 'Masculino' },
  { valor: 'nao_binario', label: 'Nao-binario' },
  { valor: 'prefiro_nao_dizer', label: 'Prefiro nao dizer' },
];

const faixasEtarias = [
  { valor: '20-29', label: '20 a 29 anos' },
  { valor: '30-39', label: '30 a 39 anos' },
  { valor: '40-49', label: '40 a 49 anos' },
  { valor: '50-59', label: '50 a 59 anos' },
  { valor: '60+', label: '60 anos ou mais' },
];

const frequencias = [
  { valor: 'integral', label: 'Tempo integral (40h+)' },
  { valor: 'parcial', label: 'Meio periodo (20h)' },
  { valor: 'eventual', label: 'Eventual / substituto' },
];

export default function CadastroPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState(1);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaConfirm, setSenhaConfirm] = useState('');
  const [genero, setGenero] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [frequenciaAulas, setFrequenciaAulas] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    setErro('');

    if (senha !== senhaConfirm) {
      setErro('As senhas nao coincidem');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'registro',
          nome,
          email,
          senha,
          genero: genero || undefined,
          faixaEtaria: faixaEtaria || undefined,
          frequenciaAulas: frequenciaAulas || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao cadastrar');
        return;
      }

      router.push('/professor');
    } catch {
      setErro('Erro de conexao. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-warm-50 bg-organic relative overflow-hidden">
      {/* Decorative organic background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-3xl animate-breathe" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-50/40 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary-100/20 rounded-full blur-3xl animate-breathe" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Logo size={56} className="mx-auto" />
          <h1 className="text-2xl font-bold text-warm-800 mt-4">Cadastro de Professor</h1>
          <p className="text-warm-500 text-sm mt-1.5 font-medium">Crie sua conta para acessar a plataforma</p>
        </div>

        {/* Step indicator - pill shaped */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {[1, 2].map((e) => (
            <div key={e} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  etapa >= e
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'bg-warm-200 text-warm-400'
                }`}>
                  {etapa > e ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : e}
                </div>
                <span className={`text-sm font-semibold hidden sm:inline transition-colors duration-300 ${
                  etapa >= e ? 'text-primary-700' : 'text-warm-400'
                }`}>
                  {e === 1 ? 'Dados de acesso' : 'Perfil'}
                </span>
              </div>
              {e < 2 && (
                <div className="w-12 h-1 rounded-full overflow-hidden bg-warm-200">
                  <div className={`h-full rounded-full bg-primary-500 transition-all duration-700 ease-out ${
                    etapa > 1 ? 'w-full' : 'w-0'
                  }`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="card p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {etapa === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="font-bold text-warm-800 text-lg">Dados de acesso</h2>
                <p className="text-warm-500 text-sm mt-0.5">Preencha seus dados para criar sua conta</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

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
                  placeholder="Minimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Confirmar senha</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repita a senha"
                  value={senhaConfirm}
                  onChange={(e) => setSenhaConfirm(e.target.value)}
                  required
                />
              </div>

              {erro && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl border border-red-100 animate-fade-in">
                  {erro}
                </div>
              )}

              <button
                onClick={() => {
                  setErro('');
                  if (!nome.trim() || !email.trim() || !senha.trim()) {
                    setErro('Preencha todos os campos obrigatorios');
                    return;
                  }
                  if (senha !== senhaConfirm) {
                    setErro('As senhas nao coincidem');
                    return;
                  }
                  setEtapa(2);
                }}
                className="btn-primary w-full"
              >
                Proximo
              </button>
            </div>
          )}

          {etapa === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="font-bold text-warm-800 text-lg">Perfil profissional</h2>
                <p className="text-warm-500 text-sm mt-0.5">Opcional — ajuda a personalizar sua experiencia</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-2">Genero</label>
                <div className="grid grid-cols-2 gap-2">
                  {generos.map((g) => (
                    <button
                      key={g.valor}
                      onClick={() => setGenero(g.valor)}
                      className={`px-4 py-2.5 rounded-2xl text-sm font-medium border-2 transition-all duration-200 ${
                        genero === g.valor
                          ? 'border-primary-400 bg-primary-50 text-primary-700 shadow-warm-sm'
                          : 'border-warm-200 text-warm-600 hover:border-primary-200 hover:bg-primary-50/50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-2">Faixa etaria</label>
                <div className="grid grid-cols-2 gap-2">
                  {faixasEtarias.map((f) => (
                    <button
                      key={f.valor}
                      onClick={() => setFaixaEtaria(f.valor)}
                      className={`px-4 py-2.5 rounded-2xl text-sm font-medium border-2 transition-all duration-200 ${
                        faixaEtaria === f.valor
                          ? 'border-primary-400 bg-primary-50 text-primary-700 shadow-warm-sm'
                          : 'border-warm-200 text-warm-600 hover:border-primary-200 hover:bg-primary-50/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-2">Frequencia de aulas</label>
                <div className="space-y-2">
                  {frequencias.map((f) => (
                    <button
                      key={f.valor}
                      onClick={() => setFrequenciaAulas(f.valor)}
                      className={`w-full px-4 py-2.5 rounded-2xl text-sm font-medium border-2 text-left transition-all duration-200 ${
                        frequenciaAulas === f.valor
                          ? 'border-primary-400 bg-primary-50 text-primary-700 shadow-warm-sm'
                          : 'border-warm-200 text-warm-600 hover:border-primary-200 hover:bg-primary-50/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl border border-red-100 animate-fade-in">
                  {erro}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setEtapa(1)} className="btn-secondary flex-1">
                  Voltar
                </button>
                <button
                  onClick={handleCadastro}
                  disabled={carregando}
                  className="btn-primary flex-1"
                >
                  {carregando ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Cadastrando...
                    </span>
                  ) : 'Criar conta'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-warm-500 mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          Ja tem conta?{' '}
          <a href="/" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
            Faca login
          </a>
        </p>
      </div>
    </div>
  );
}
