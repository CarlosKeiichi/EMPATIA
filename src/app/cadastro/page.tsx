'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const generos = [
  { valor: 'feminino', label: 'Feminino' },
  { valor: 'masculino', label: 'Masculino' },
  { valor: 'nao_binario', label: 'Não-binário' },
  { valor: 'prefiro_nao_dizer', label: 'Prefiro não dizer' },
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
  { valor: 'parcial', label: 'Meio período (20h)' },
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
      setErro('As senhas não coincidem');
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
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Logo size={56} className="mx-auto" />
          <h1 className="text-xl font-bold text-gray-800 mt-3">Cadastro de Professor</h1>
          <p className="text-gray-500 text-sm mt-1">Crie sua conta para acessar a plataforma</p>
        </div>

        {/* Indicador de etapas */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((e) => (
            <div key={e} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                etapa >= e ? 'bg-[#7c6bab] text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {e}
              </div>
              {e < 2 && <div className={`w-12 h-0.5 ${etapa > 1 ? 'bg-[#7c6bab]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {etapa === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">Dados de acesso</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
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
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repita a senha"
                  value={senhaConfirm}
                  onChange={(e) => setSenhaConfirm(e.target.value)}
                  required
                />
              </div>

              {erro && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{erro}</div>}

              <button
                onClick={() => {
                  setErro('');
                  if (!nome.trim() || !email.trim() || !senha.trim()) {
                    setErro('Preencha todos os campos obrigatórios');
                    return;
                  }
                  if (senha !== senhaConfirm) {
                    setErro('As senhas não coincidem');
                    return;
                  }
                  setEtapa(2);
                }}
                className="btn-primary w-full bg-[#7c6bab] hover:bg-[#6b5a9a]"
              >
                Próximo
              </button>
            </div>
          )}

          {etapa === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">Perfil profissional</h2>
              <p className="text-xs text-gray-400">Opcional — ajuda a personalizar sua experiência</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gênero</label>
                <div className="grid grid-cols-2 gap-2">
                  {generos.map((g) => (
                    <button
                      key={g.valor}
                      onClick={() => setGenero(g.valor)}
                      className={`px-3 py-2 rounded-lg text-sm border transition ${
                        genero === g.valor
                          ? 'border-[#7c6bab] bg-purple-50 text-[#7c6bab]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Faixa etária</label>
                <div className="grid grid-cols-2 gap-2">
                  {faixasEtarias.map((f) => (
                    <button
                      key={f.valor}
                      onClick={() => setFaixaEtaria(f.valor)}
                      className={`px-3 py-2 rounded-lg text-sm border transition ${
                        faixaEtaria === f.valor
                          ? 'border-[#7c6bab] bg-purple-50 text-[#7c6bab]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequência de aulas</label>
                <div className="space-y-2">
                  {frequencias.map((f) => (
                    <button
                      key={f.valor}
                      onClick={() => setFrequenciaAulas(f.valor)}
                      className={`w-full px-3 py-2 rounded-lg text-sm border text-left transition ${
                        frequenciaAulas === f.valor
                          ? 'border-[#7c6bab] bg-purple-50 text-[#7c6bab]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {erro && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{erro}</div>}

              <div className="flex gap-3">
                <button onClick={() => setEtapa(1)} className="btn-secondary flex-1">
                  Voltar
                </button>
                <button
                  onClick={handleCadastro}
                  disabled={carregando}
                  className="btn-primary flex-1 bg-[#7c6bab] hover:bg-[#6b5a9a]"
                >
                  {carregando ? 'Cadastrando...' : 'Criar conta'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          Já tem conta?{' '}
          <a href="/" className="text-[#7c6bab] font-medium hover:underline">
            Faça login
          </a>
        </p>
      </div>
    </div>
  );
}
