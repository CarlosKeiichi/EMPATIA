'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface DashboardData {
  totalProfessores: number;
  totalProfessoresEscola: number;
  jornadasConcluidas: number;
  taxaConclusao: number;
  taxaAbandono: number;
  duracaoMedia: number;
  irpe: { valor: number; nivel: string; cor: string };
  irpr: { valor: number; nivel: string; cor: string } | null;
  ipcs?: {
    media: number;
    zona: string;
    distribuicao: { sem_sinais: number; resistencia: number; estresse_elevado: number };
    totalProfessoresAvaliados: number;
  };
  distribuicaoEmocional: Record<string, number>;
  distribuicaoEstiloComunicacao: Record<string, number> | null;
  ieMedia: { pontuacao: number; classificacao: string; nivel: string; media: number } | null;
  radarEstresse: { dimensao: string; valor: number }[];
  nuvemPalavras?: { texto: string; contagem: number }[];
  ibedMedio: number;
  ibedDiferencaMedia: number;
}

interface InsightsData {
  dores: { resumo: string };
  planoAcao: { resumo: string; acoes: string[] };
  beneficios: { resumo: string };
  baseadoEm: { totalProfessores: number; totalJornadas: number; totalRespostas: number };
}

export default function RelatorioNR1Page() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then((r) => r.json()),
      fetch('/api/admin/insights').then((r) => r.json()),
    ])
      .then(([dashData, insightsData]) => {
        setDados(dashData);
        setInsights(insightsData);
      })
      .catch((e) => console.error(e))
      .finally(() => setCarregando(false));
  }, []);

  function exportarPDF() {
    window.print();
  }

  if (carregando) {
    return (
      <AdminLayout titulo="Relatório NR-1" subtitulo="PGR-Ready · Conformidade 2026">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-[3px] border-[#ede8f7] rounded-full" />
              <div className="absolute inset-0 border-[3px] border-transparent border-t-[#2D5A4B] rounded-full animate-spin" />
            </div>
            <p className="text-warm-500 text-sm font-semibold">Gerando relatório...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!dados) {
    return (
      <AdminLayout titulo="Relatório NR-1" subtitulo="PGR-Ready · Conformidade 2026">
        <div className="text-center py-32">
          <p className="text-red-600 font-semibold">Erro ao carregar dados</p>
        </div>
      </AdminLayout>
    );
  }

  // === Cálculos derivados ===
  const totalEmocional = Object.values(dados.distribuicaoEmocional).reduce((a, b) => a + b, 0);
  const cansados = dados.distribuicaoEmocional['Cansado'] || 0;
  const sobrecarregados = dados.distribuicaoEmocional['Sobrecarregado'] || 0;
  const alerta = dados.distribuicaoEmocional['Em alerta'] || 0;
  const esperancosos = dados.distribuicaoEmocional['Esperançoso'] || 0;
  const fortalecidos = dados.distribuicaoEmocional['Fortalecido'] || 0;
  const percCriticos = totalEmocional > 0 ? ((cansados + sobrecarregados) / totalEmocional) * 100 : 0;
  const percAlerta = totalEmocional > 0 ? (alerta / totalEmocional) * 100 : 0;
  const percEsperancosos = totalEmocional > 0 ? (esperancosos / totalEmocional) * 100 : 0;
  const percFortalecidos = totalEmocional > 0 ? (fortalecidos / totalEmocional) * 100 : 0;
  const percCansados = totalEmocional > 0 ? (cansados / totalEmocional) * 100 : 0;
  const percSobrecarregados = totalEmocional > 0 ? (sobrecarregados / totalEmocional) * 100 : 0;

  // Estilo de comunicação
  const totalEstilo = dados.distribuicaoEstiloComunicacao
    ? Object.values(dados.distribuicaoEstiloComunicacao).reduce((a, b) => a + b, 0)
    : 0;
  const percPassivo = totalEstilo > 0 ? ((dados.distribuicaoEstiloComunicacao?.['Passivo'] || 0) / totalEstilo) * 100 : 0;
  const percAgressivo = totalEstilo > 0 ? ((dados.distribuicaoEstiloComunicacao?.['Agressivo'] || 0) / totalEstilo) * 100 : 0;
  const percAssertivo = totalEstilo > 0 ? ((dados.distribuicaoEstiloComunicacao?.['Assertivo'] || 0) / totalEstilo) * 100 : 0;
  const percPassivoAgressivo = totalEstilo > 0 ? ((dados.distribuicaoEstiloComunicacao?.['Passivo-Agressivo'] || 0) / totalEstilo) * 100 : 0;

  // IRPE por dimensão (filtrando blocos relacionais)
  const MAPA_DIMENSAO_REL: Record<string, string> = {
    'Autocuidado': 'Relação Intrapessoal',
    'Vínculos Familiares': 'Relações Familiares',
    'Rede de Apoio': 'Relações Interpessoais',
    'Satisfação Geral': 'Satisfação Geral',
  };
  const MAPA_SUB: Record<string, string> = {
    'Autocuidado': 'Autocuidado e autoestima',
    'Vínculos Familiares': 'Vínculos e suporte familiar',
    'Rede de Apoio': 'Colegas, gestão e famílias',
    'Satisfação Geral': 'Bem-estar global no trabalho',
  };
  const dimensoesRelacionais = (dados.radarEstresse || [])
    .filter((r) => MAPA_DIMENSAO_REL[r.dimensao])
    .map((r) => ({
      dimensao: MAPA_DIMENSAO_REL[r.dimensao],
      sub: MAPA_SUB[r.dimensao],
      valor: r.valor,
    }));

  const hoje = new Date();
  const mesAtual = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const dataEmissao = `${hoje.toLocaleDateString('pt-BR', { month: 'long' })} / ${hoje.getFullYear()}`;
  const dataArquivo = `${hoje.toLocaleDateString('pt-BR', { month: 'long' })} / ${hoje.getFullYear() + 20}`;
  const proximaRevisao = new Date(hoje);
  proximaRevisao.setMonth(proximaRevisao.getMonth() + 3);
  const proximaRevisaoStr = proximaRevisao.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

  const ipcsMedia = dados.ipcs?.media || 0;
  const zonaIpcs = ipcsMedia >= 14 ? 'ESTRESSE ELEVADO' : ipcsMedia >= 7 ? 'RESISTÊNCIA' : 'SEM SINAIS';
  const irpeVal = dados.irpe?.valor || 0;
  const nivelIrpe = irpeVal >= 0.6 ? 'RISCO ALTO' : irpeVal >= 0.3 ? 'RISCO MODERADO' : 'RISCO BAIXO';

  return (
    <AdminLayout titulo="Relatório NR-1" subtitulo="PGR-Ready · Conformidade 2026">
      {/* Botão de exportar (oculto na impressão) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <p className="text-[13px] text-warm-500 font-medium">
            Documento gerado com base em {dados.jornadasConcluidas} jornadas de {dados.totalProfessores} professores
          </p>
        </div>
        <button
          onClick={exportarPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2D5A4B] hover:bg-[#1f4034] text-white text-sm font-bold rounded-xl transition-colors shadow-warm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* === DOCUMENTO DO RELATÓRIO === */}
      <div className="nr1-report bg-white">
        {/* ============================================ */}
        {/* PÁGINA 1 — CAPA                              */}
        {/* ============================================ */}
        <section className="nr1-page nr1-capa">
          <div className="nr1-capa-header">
            <div className="nr1-logo">
              <span>Empat</span><span className="italic">IA</span>
            </div>
            <div className="nr1-badge">PGR-READY · NR-1 CONFORMIDADE 2026</div>
          </div>

          <div className="nr1-capa-content">
            <p className="nr1-eyebrow">SEÇÃO 5 DO PGR — FATORES DE RISCO PSICOSSOCIAL</p>
            <h1 className="nr1-titulo-capa">
              Relatório de <span className="italic">Riscos Psicossociais</span><br />
              do Corpo Docente
            </h1>
            <p className="nr1-subtitulo">
              Documento elaborado conforme o item 1.5.4.4(e) da NR-1 (Portaria MTE
              nº 1.419/2024), para integração ao Programa de Gerenciamento de
              Riscos (PGR) da instituição. Inclui inventário de riscos, avaliação por
              severidade, plano de ação com responsáveis e prazos, e registro de
              arquivo por 20 anos.
            </p>
          </div>

          <hr className="nr1-divider" />

          <div className="nr1-meta-grid">
            <div>
              <p className="nr1-meta-label">INSTITUIÇÃO</p>
              <p className="nr1-meta-valor">Rede Dinâmica de Ensino</p>
            </div>
            <div>
              <p className="nr1-meta-label">PERÍODO AVALIADO</p>
              <p className="nr1-meta-valor">{mesAtual}</p>
            </div>
            <div>
              <p className="nr1-meta-label">DOCENTES AVALIADOS</p>
              <p className="nr1-meta-valor">{dados.totalProfessores} professores</p>
            </div>
            <div>
              <p className="nr1-meta-label">PRÓXIMA REVISÃO</p>
              <p className="nr1-meta-valor">{proximaRevisaoStr}</p>
            </div>
          </div>

          <div className="nr1-instrucao-sst">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D5A4B" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="2" width="6" height="4" rx="1" />
              <path d="M9 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-3" />
            </svg>
            <p>
              <strong>Instrução para o técnico de SST:</strong> Este documento é o insumo técnico da Seção 5 (Fatores de Risco Psicossocial) do PGR. Deve ser anexado ao
              PGR vigente da instituição, com assinatura do responsável técnico. Arquivo mínimo: 20 anos (conforme NR-1 item 1.5.7).
            </p>
          </div>

          <div className="nr1-capa-footer">
            <hr className="nr1-divider" />
            <div className="nr1-footer-row">
              <span>Confidencial — uso restrito à gestão e ao técnico de SST responsável pelo PGR</span>
              <span>EmpatIA · empatia.com.br · {mesAtual}</span>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* PÁGINA 2 — ATENÇÃO + METODOLOGIA + ADESÃO   */}
        {/* ============================================ */}
        <section className="nr1-page">
          {/* Alerta principal */}
          <div className="nr1-alerta-critico">
            <span className="nr1-alerta-icon">⚠</span>
            <div>
              <p className="nr1-alerta-titulo">
                ATENÇÃO: {percCriticos.toFixed(0)}% dos professores em estado emocional crítico (Cansado ou Sobrecarregado)
              </p>
              <p className="nr1-alerta-sub">
                IRPE: {irpeVal.toFixed(2)} — {nivelIrpe}. Fiscalização pelo MTE inicia em 26/05/2026. Ação imediata recomendada antes dessa data.
              </p>
            </div>
          </div>

          <p className="nr1-eyebrow">BASE LEGAL & METODOLOGIA</p>
          <h2 className="nr1-h2">Conformidade NR-1 e Instrumentos Utilizados</h2>

          {/* Status de conformidade */}
          <div className="nr1-status-card">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 2L3 7v6c0 5 3.5 9 9 10 5.5-1 9-5 9-10V7l-9-5z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <div>
              <p className="nr1-status-titulo">Status de Conformidade — NR-1 item 1.5.4.4(e)</p>
              <p className="nr1-status-texto">
                Riscos psicossociais identificados, avaliados e documentados conforme exigência. Plano de ação com responsáveis e prazos
                definidos. Registro arquivado para fiscalização a partir de 26/05/2026.
              </p>
            </div>
            <div className="nr1-status-check">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8fbea3" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p>PGR-READY</p>
            </div>
          </div>

          {/* Metodologia */}
          <div className="nr1-metodologia">
            <p className="nr1-metodologia-titulo">METODOLOGIA DE AVALIAÇÃO DECLARADA</p>
            <div className="nr1-metodologia-grid">
              <div>
                <p className="nr1-inst-label">INSTRUMENTO 1</p>
                <p className="nr1-inst-texto">
                  <strong>IPCS — Inventário de Percepção do Estresse Ocupacional</strong> (escala 0–20 pts). Avalia estresse
                  por dimensão: relações no trabalho, atividade docente, autocuidado, vínculos e satisfação geral.
                </p>
              </div>
              <div>
                <p className="nr1-inst-label">INSTRUMENTO 3</p>
                <p className="nr1-inst-texto">
                  <strong>IBED — Índice de Bem-Estar Docente.</strong> Indicador proprietário que monitora evolução longitudinal
                  do bem-estar ao longo das jornadas (0 = sem melhora, positivo = melhora).
                </p>
              </div>
              <div>
                <p className="nr1-inst-label">INSTRUMENTO 5</p>
                <p className="nr1-inst-texto">
                  <strong>Análise Conversacional via MarcIA</strong> — entrevistas estruturadas por IA (NLP), com
                  extração de temas recorrentes, perfil emocional e tendência longitudinal. Base: {insights?.baseadoEm.totalRespostas || 0} respostas, {dados.jornadasConcluidas} jornadas.
                </p>
              </div>
              <div>
                <p className="nr1-inst-label">INSTRUMENTO 2</p>
                <p className="nr1-inst-texto">
                  <strong>Escala de Inteligência Emocional</strong> (15–75 pts). Mede capacidade de identificação,
                  compreensão e regulação emocional dos trabalhadores.
                </p>
              </div>
              <div>
                <p className="nr1-inst-label">INSTRUMENTO 4</p>
                <p className="nr1-inst-texto">
                  <strong>IRPE — Índice Relacional de Professores e Escola</strong> (0–1). Avalia risco psicossocial agregado
                  por dimensão: intrapessoal, familiar, interpessoal e satisfação geral.
                </p>
              </div>
              <div>
                <p className="nr1-inst-label">COLETA DE DADOS</p>
                <p className="nr1-inst-texto">
                  Anônima e agregada. Consentimento livre e esclarecido (LGPD Art. 11). Dados individuais não
                  identificados à gestão.
                </p>
              </div>
            </div>
            <div className="nr1-nota-tecnica">
              <strong>Nota técnica:</strong> A NR-1 não determina instrumentos específicos, exigindo que a organização selecione ferramentas adequadas ao perfil do risco (item 1.5.4.4). Os
              instrumentos acima são validados para populações docentes e compatíveis com a abordagem ergonômica da NR-17. Esta avaliação pode ser complementada por
              AEP/AET quando solicitado pelo técnico de SST responsável.
            </div>
          </div>

          {/* Indicadores de adesão */}
          <p className="nr1-eyebrow" style={{ marginTop: '32px' }}>ENGAJAMENTO & COBERTURA</p>
          <h2 className="nr1-h2">Indicadores de Adesão ao Programa</h2>

          <div className="nr1-indicadores-grid">
            <div className="nr1-ind-card">
              <div className="nr1-ind-valor">{dados.totalProfessores}/{dados.totalProfessoresEscola}</div>
              <div className="nr1-ind-label">Respondentes de {dados.totalProfessoresEscola} professores</div>
              <div className="nr1-ind-sub">{dados.taxaConclusao >= 1 ? '100%' : `${(dados.taxaConclusao * 100).toFixed(0)}%`} cobertura</div>
            </div>
            <div className="nr1-ind-card">
              <div className="nr1-ind-valor">{dados.jornadasConcluidas}</div>
              <div className="nr1-ind-label">Jornadas concluídas</div>
              <div className="nr1-ind-sub" style={{ color: '#2D5A4B' }}>{(dados.taxaAbandono * 100).toFixed(0)}% abandono</div>
            </div>
            <div className="nr1-ind-card">
              <div className="nr1-ind-valor">{(dados.taxaConclusao * 100).toFixed(0)}%</div>
              <div className="nr1-ind-label">Taxa de conclusão das jornadas</div>
              <div className="nr1-ind-sub" style={{ color: '#2D5A4B' }}>Boa adesão</div>
            </div>
            <div className="nr1-ind-card">
              <div className="nr1-ind-valor">{dados.duracaoMedia}min</div>
              <div className="nr1-ind-label">Duração média por jornada</div>
              <div className="nr1-ind-sub" style={{ color: '#2D5A4B' }}>Engajamento real</div>
            </div>
            <div className="nr1-ind-card" style={{ background: '#fef6e7' }}>
              <div className="nr1-ind-valor" style={{ color: '#b35c00' }}>{insights?.baseadoEm.totalRespostas || 0}</div>
              <div className="nr1-ind-label">Respostas coletadas</div>
              <div className="nr1-ind-sub" style={{ color: '#b35c00' }}>Base de análise</div>
            </div>
          </div>

          <p className="nr1-eyebrow" style={{ marginTop: '32px' }}>SEÇÃO 5.1 DO PGR — INVENTÁRIO DE RISCOS OCUPACIONAIS</p>
          <h2 className="nr1-h2">Inventário de Riscos Psicossociais</h2>

          <table className="nr1-tabela">
            <thead>
              <tr>
                <th>CÓD.</th>
                <th>FATOR DE RISCO PSICOSSOCIAL</th>
                <th>PREVALÊNCIA</th>
                <th>SEVERIDADE</th>
                <th>PROBABILIDADE</th>
                <th>NÍVEL DE RISCO</th>
                <th>EVIDÊNCIA (NR-1 ITEM 1.5.4.4)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="nr1-cod">PS-01</td>
                <td>
                  <strong>Esgotamento emocional</strong>
                  <div className="nr1-td-sub">Burnout / Cansaço crônico</div>
                </td>
                <td><strong>{percCriticos.toFixed(0)}%</strong></td>
                <td><span className="nr1-tag nr1-tag-alta">Alta</span></td>
                <td><span className="nr1-tag nr1-tag-alta">Alta</span></td>
                <td><span className="nr1-risco nr1-risco-alto">■ ALTO</span></td>
                <td className="nr1-td-evidencia">
                  {percCansados.toFixed(0)}% Cansado + {percSobrecarregados.toFixed(0)}% Sobrecarregado. {cansados + sobrecarregados}/{dados.jornadasConcluidas} jornadas encerradas com emoção negativa.
                </td>
              </tr>
              <tr>
                <td className="nr1-cod">PS-02</td>
                <td>
                  <strong>Sobrecarga quantitativa</strong>
                  <div className="nr1-td-sub">Excesso de demandas</div>
                </td>
                <td>—</td>
                <td><span className="nr1-tag nr1-tag-media">Média</span></td>
                <td><span className="nr1-tag nr1-tag-alta">Alta</span></td>
                <td><span className="nr1-risco nr1-risco-medio">■ MÉDIO</span></td>
                <td className="nr1-td-evidencia">
                  Nuvem de palavras: &ldquo;frequentemente&rdquo;, &ldquo;quasesempre&rdquo;, &ldquo;não consigo parar&rdquo;. Relatos de autocobrança sem espaço para descanso.
                </td>
              </tr>
              <tr>
                <td className="nr1-cod">PS-03</td>
                <td>
                  <strong>Falta de reconhecimento</strong>
                  <div className="nr1-td-sub">Esforço não valorizado</div>
                </td>
                <td>—</td>
                <td><span className="nr1-tag nr1-tag-media">Média</span></td>
                <td><span className="nr1-tag nr1-tag-media">Média</span></td>
                <td><span className="nr1-risco nr1-risco-medio">■ MÉDIO</span></td>
                <td className="nr1-td-evidencia">
                  Análise MarcIA: &ldquo;sensação de esforço não reconhecido&rdquo; como tema recorrente. Palavra &ldquo;reconhecida&rdquo; na nuvem de palavras.
                </td>
              </tr>
              <tr>
                <td className="nr1-cod">PS-04</td>
                <td>
                  <strong>Conflitos interpessoais</strong>
                  <div className="nr1-td-sub">Entre colegas e falta de colaboração</div>
                </td>
                <td>—</td>
                <td><span className="nr1-tag nr1-tag-media">Média</span></td>
                <td><span className="nr1-tag nr1-tag-media">Média</span></td>
                <td><span className="nr1-risco nr1-risco-medio">■ MÉDIO</span></td>
                <td className="nr1-td-evidencia">
                  IRPE relações interpessoais: {dimensoesRelacionais.find((d) => d.dimensao === 'Relações Interpessoais')?.valor.toFixed(1) || '—'}/10 — zona de atenção. MarcIA identifica conflitos entre colegas como foco prioritário.
                </td>
              </tr>
              <tr>
                <td className="nr1-cod">PS-05</td>
                <td>
                  <strong>Baixa satisfação relacional</strong>
                  <div className="nr1-td-sub">Vínculos familiares e intrapessoal</div>
                </td>
                <td>—</td>
                <td><span className="nr1-tag nr1-tag-media">Média</span></td>
                <td><span className="nr1-tag nr1-tag-media">Média</span></td>
                <td><span className="nr1-risco nr1-risco-medio">■ MÉDIO</span></td>
                <td className="nr1-td-evidencia">
                  IRPE: relação intrapessoal {dimensoesRelacionais.find((d) => d.dimensao === 'Relação Intrapessoal')?.valor.toFixed(1) || '—'}, vínculos familiares {dimensoesRelacionais.find((d) => d.dimensao === 'Relações Familiares')?.valor.toFixed(1) || '—'}, satisfação geral {dimensoesRelacionais.find((d) => d.dimensao === 'Satisfação Geral')?.valor.toFixed(1) || '—'} — todas em zona de atenção.
                </td>
              </tr>
              <tr>
                <td className="nr1-cod">PS-06</td>
                <td>
                  <strong>Comunicação não-assertiva</strong>
                  <div className="nr1-td-sub">Passividade e supressão de necessidades</div>
                </td>
                <td><strong>{percPassivo.toFixed(0)}%</strong></td>
                <td><span className="nr1-tag nr1-tag-media">Média</span></td>
                <td><span className="nr1-tag nr1-tag-alta">Alta</span></td>
                <td><span className="nr1-risco nr1-risco-medio">■ MÉDIO</span></td>
                <td className="nr1-td-evidencia">
                  {percPassivo.toFixed(0)}% com estilo comunicativo Passivo. {percAssertivo.toFixed(0)}% Assertivo. Professores não expressam necessidades com segurança — fator agravante dos demais riscos.
                </td>
              </tr>
            </tbody>
          </table>
          <p className="nr1-legenda">
            Legenda de nível de risco: <strong>ALTO</strong> = ação imediata obrigatória · <strong>MÉDIO</strong> = ação planejada em até 90 dias · <strong>BAIXO</strong> = monitoramento periódico. Nenhum fator em nível baixo neste ciclo.
          </p>
        </section>

        {/* ============================================ */}
        {/* PÁGINA 3 — PERFIL EMOCIONAL + IRPE          */}
        {/* ============================================ */}
        <section className="nr1-page">
          <p className="nr1-eyebrow">SEÇÃO 5.2 DO PGR — RESULTADOS DA AVALIAÇÃO</p>
          <h2 className="nr1-h2">Perfil Emocional & Estresse Ocupacional</h2>

          <div className="nr1-perfil-grid">
            {/* Perfil emocional */}
            <div className="nr1-perfil-card">
              <p className="nr1-perfil-titulo">PERFIL EMOCIONAL — IPCS ({totalEmocional} PROFESSORES)</p>
              <div className="nr1-emocao-lista">
                <EmocaoLinha emoji="😮‍💨" nome="Cansado" perc={percCansados} qtd={cansados} cor="#c2410c" />
                <EmocaoLinha emoji="⚡" nome="Em alerta" perc={percAlerta} qtd={alerta} cor="#d97706" />
                <EmocaoLinha emoji="🫂" nome="Sobrecarregado" perc={percSobrecarregados} qtd={sobrecarregados} cor="#dc2626" />
                <EmocaoLinha emoji="🌟" nome="Esperançoso" perc={percEsperancosos} qtd={esperancosos} cor="#2D5A4B" />
                <EmocaoLinha emoji="💪" nome="Fortalecido" perc={percFortalecidos} qtd={fortalecidos} cor="#2D5A4B" />
              </div>
              <p className="nr1-perfil-alert">
                ⚠ {percCriticos.toFixed(0)}% em estado emocional crítico (PS-01 confirmado)
              </p>
            </div>

            {/* Estresse ocupacional */}
            <div className="nr1-perfil-card">
              <p className="nr1-perfil-titulo">ESTRESSE OCUPACIONAL — IPCS MÉDIO</p>
              <div className="nr1-ipcs-central">
                <p className="nr1-ipcs-valor">{ipcsMedia.toFixed(1)}<span className="nr1-ipcs-max">/20</span></p>
                <p className="nr1-ipcs-zona">{zonaIpcs}</p>
                <p className="nr1-ipcs-sub">média dos {dados.ipcs?.totalProfessoresAvaliados || 0} professores</p>
              </div>
              <div className="nr1-ipcs-dist">
                <div>
                  <p className="nr1-ipcs-dist-num" style={{ color: '#2D5A4B' }}>{dados.ipcs?.distribuicao.sem_sinais || 0}</p>
                  <p className="nr1-ipcs-dist-label">SEM SINAIS</p>
                  <p className="nr1-ipcs-dist-range">0–6 PTS</p>
                </div>
                <div>
                  <p className="nr1-ipcs-dist-num" style={{ color: '#d97706' }}>{dados.ipcs?.distribuicao.resistencia || 0}</p>
                  <p className="nr1-ipcs-dist-label">RESISTÊNCIA</p>
                  <p className="nr1-ipcs-dist-range">7–13 PTS</p>
                </div>
                <div>
                  <p className="nr1-ipcs-dist-num" style={{ color: '#dc2626' }}>{dados.ipcs?.distribuicao.estresse_elevado || 0}</p>
                  <p className="nr1-ipcs-dist-label">ESTRESSE ELEVADO</p>
                  <p className="nr1-ipcs-dist-range">14–20 PTS</p>
                </div>
              </div>
            </div>
          </div>

          {/* IRPE geral */}
          <div className="nr1-irpe-card">
            <p className="nr1-irpe-label">IRPE — ÍNDICE RELACIONAL (0–1)</p>
            <p className="nr1-irpe-valor">{irpeVal.toFixed(2)}</p>
            <p className="nr1-irpe-nivel">{nivelIrpe}</p>
            <p className="nr1-irpe-sub">
              Todas as {dimensoesRelacionais.length} dimensões relacionais em zona de atenção (4–6). Nenhuma em baixo risco. Implementar programa de apoio emocional estruturado.
            </p>
          </div>

          {/* Tabela de dimensões relacionais */}
          <table className="nr1-tabela nr1-tabela-compacta">
            <thead>
              <tr>
                <th>DIMENSÃO RELACIONAL (IRPE)</th>
                <th>SCORE (0–10)</th>
                <th>CLASSIFICAÇÃO</th>
                <th>DISTRIBUIÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {dimensoesRelacionais.map((d, i) => {
                const classif = d.valor >= 7 ? 'Alto' : d.valor >= 4 ? 'Atenção' : 'Baixo';
                const corClass = d.valor >= 7 ? '#dc2626' : d.valor >= 4 ? '#d97706' : '#2D5A4B';
                return (
                  <tr key={i}>
                    <td>
                      <strong>{d.dimensao}</strong>
                      <div className="nr1-td-sub">{d.sub}</div>
                    </td>
                    <td><strong>{d.valor.toFixed(1)}</strong></td>
                    <td><span className="nr1-tag" style={{ backgroundColor: `${corClass}22`, color: corClass }}>⚡ {classif}</span></td>
                    <td>
                      <div className="nr1-bar-container">
                        <div className="nr1-bar-fill" style={{ width: `${(d.valor / 10) * 100}%`, background: corClass }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Plano de ação 5W2H */}
          <p className="nr1-eyebrow" style={{ marginTop: '32px' }}>SEÇÃO 5.3 DO PGR — PLANO DE AÇÃO (5W2H)</p>
          <h2 className="nr1-h2">Plano de Ação com Responsáveis e Prazos</h2>

          <table className="nr1-tabela nr1-plano-tabela">
            <thead>
              <tr>
                <th>#</th>
                <th>AÇÃO (WHAT)</th>
                <th>POR QUÊ (WHY)</th>
                <th>RESPONSÁVEL (WHO)</th>
                <th>PRAZO (WHEN)</th>
                <th>COMO (HOW)</th>
                <th>RISCO</th>
                <th>PRIORIDADE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="nr1-circle">1</span></td>
                <td><strong>Escuta individual com professores em estado crítico</strong></td>
                <td>{percCriticos.toFixed(0)}% Cansado/Sobrecarregado. Isolamento relatado.</td>
                <td>Coordenação Pedagógica + Psicólogo parceiro</td>
                <td><strong>Até 30/05/2026</strong></td>
                <td>Conversa individual de 30min. Encaminhamento para psicólogo quando indicado pela MarcIA.</td>
                <td><span className="nr1-tag nr1-tag-alta">PS-01</span></td>
                <td><span className="nr1-tag" style={{ background: '#fee2e2', color: '#b91c1c' }}>URGENTE</span></td>
                <td>☐ Pendente</td>
              </tr>
              <tr>
                <td><span className="nr1-circle">2</span></td>
                <td><strong>Ritual de reconhecimento docente</strong></td>
                <td>Sensação de esforço não reconhecido — fator de risco PS-03.</td>
                <td>Diretoria Pedagógica</td>
                <td><strong>Até 30/06/2026</strong></td>
                <td>Criar momento semanal/quinzenal de valorização. Comunicado formal à equipe sobre importância do trabalho docente.</td>
                <td><span className="nr1-tag nr1-tag-media">PS-03</span></td>
                <td><span className="nr1-tag" style={{ background: '#fef3c7', color: '#92400e' }}>ALTA</span></td>
                <td>☐ Pendente</td>
              </tr>
              <tr>
                <td><span className="nr1-circle">3</span></td>
                <td><strong>Espaço coletivo de mediação entre colegas</strong></td>
                <td>Conflitos interpessoais — PS-04. IRPE interpessoal {dimensoesRelacionais.find((d) => d.dimensao === 'Relações Interpessoais')?.valor.toFixed(1) || '—'}.</td>
                <td>RH / Coordenação + Facilitador externo</td>
                <td><strong>Até 31/07/2026</strong></td>
                <td>2 rodas de conversa facilitadas por psicólogo ou mediador. Formato: grupo de até 10 pessoas, 90min.</td>
                <td><span className="nr1-tag nr1-tag-media">PS-04</span></td>
                <td><span className="nr1-tag" style={{ background: '#fef3c7', color: '#92400e' }}>ALTA</span></td>
                <td>☐ Pendente</td>
              </tr>
              <tr>
                <td><span className="nr1-circle">4</span></td>
                <td><strong>Política de proteção ao descanso docente</strong></td>
                <td>Sobrecarga PS-02. Autocobrança sem pausas relatada.</td>
                <td>Diretoria Geral</td>
                <td><strong>Até 30/06/2026</strong></td>
                <td>Comunicado institucional sobre direito à pausa. Revisão de demandas administrativas extras. Proibir mensagens fora do horário.</td>
                <td><span className="nr1-tag nr1-tag-media">PS-02</span></td>
                <td><span className="nr1-tag" style={{ background: '#fef3c7', color: '#92400e' }}>ALTA</span></td>
                <td>☐ Pendente</td>
              </tr>
              <tr>
                <td><span className="nr1-circle">5</span></td>
                <td><strong>Treinamento em comunicação assertiva</strong></td>
                <td>{percPassivo.toFixed(0)}% comunicação passiva — PS-06. Agrava todos os demais riscos.</td>
                <td>RH / EmpatIA (módulo na plataforma)</td>
                <td><strong>Até 31/08/2026</strong></td>
                <td>Módulo de 3 semanas na plataforma EmpatIA + workshop presencial de 2h com todos os docentes.</td>
                <td><span className="nr1-tag nr1-tag-media">PS-06</span></td>
                <td><span className="nr1-tag" style={{ background: '#fef9c3', color: '#854d0e' }}>MÉDIA</span></td>
                <td>☐ Pendente</td>
              </tr>
              <tr>
                <td><span className="nr1-circle">6</span></td>
                <td><strong>Monitoramento contínuo via EmpatIA</strong></td>
                <td>NR-1 exige revisão periódica do PGR e evidência de eficácia.</td>
                <td>EmpatIA + Coordenação</td>
                <td><strong>Ciclo trimestral</strong></td>
                <td>Nova avaliação IPCS/IRPE em {proximaRevisaoStr}. Comparar com baseline deste ciclo. Relatório atualizado ao PGR.</td>
                <td><span className="nr1-tag" style={{ background: '#e0e7ff', color: '#3730a3' }}>Todos</span></td>
                <td><span className="nr1-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>CONTÍNUO</span></td>
                <td>⟳ Em curso</td>
              </tr>
            </tbody>
          </table>
          <p className="nr1-legenda">
            * O campo &ldquo;Status&rdquo; deve ser atualizado pela instituição a cada revisão do PGR. Evidências de implementação (listas de presença, atas, registros) devem ser arquivadas junto a este documento.
          </p>
        </section>

        {/* ============================================ */}
        {/* PÁGINA 4 — ESTILO DE COMUNICAÇÃO + IE + NUVEM + REGISTRO */}
        {/* ============================================ */}
        <section className="nr1-page">
          <p className="nr1-eyebrow">SEÇÃO 5.4 — DADOS COMPLEMENTARES</p>
          <h2 className="nr1-h2">Estilo de Comunicação & Inteligência Emocional</h2>

          <div className="nr1-comunic-grid">
            <div className="nr1-comunic-card">
              <p className="nr1-perfil-titulo">ESTILO DE COMUNICAÇÃO ({totalEstilo} RESPOSTAS)</p>
              <div className="nr1-emocao-lista">
                <EmocaoLinha nome="Passivo" perc={percPassivo} cor="#d97706" noQtd />
                <EmocaoLinha nome="Agressivo" perc={percAgressivo} cor="#dc2626" noQtd />
                <EmocaoLinha nome="Assertivo" perc={percAssertivo} cor="#2D5A4B" noQtd />
                <EmocaoLinha nome="Passivo-Agressivo" perc={percPassivoAgressivo} cor="#9ca3af" noQtd />
              </div>
              <p className="nr1-perfil-alert">
                ⚠ {percAssertivo.toFixed(0)}% assertivo — fator de risco PS-06 confirmado
              </p>
            </div>

            <div className="nr1-comunic-card">
              <p className="nr1-perfil-titulo">INTELIGÊNCIA EMOCIONAL (MÉDIA)</p>
              <div className="nr1-ipcs-central">
                <p className="nr1-ipcs-valor" style={{ color: '#2D5A4B' }}>
                  {dados.ieMedia ? dados.ieMedia.media.toFixed(0) : '—'}<span className="nr1-ipcs-max">/75</span>
                </p>
                <p className="nr1-ipcs-zona" style={{ color: '#2D5A4B' }}>
                  {dados.ieMedia?.classificacao || '—'} — PONTO POSITIVO
                </p>
                <p className="nr1-ipcs-sub">de 75 pontos possíveis</p>
              </div>
              <p className="nr1-comunic-texto">
                Alta IE indica consciência emocional — base favorável para resposta positiva a intervenções. Professores têm capacidade de trabalhar os fatores de risco identificados com o suporte adequado.
              </p>
            </div>
          </div>

          {/* Seção 5.5 — Temas recorrentes */}
          <p className="nr1-eyebrow" style={{ marginTop: '32px' }}>SEÇÃO 5.5 — ANÁLISE QUALITATIVA</p>
          <h2 className="nr1-h2">Temas Recorrentes & Diagnóstico MarcIA</h2>

          <div className="nr1-nuvem-card">
            <p className="nr1-nuvem-legenda">
              Palavras extraídas das conversas com a MarcIA — tamanho reflete frequência de menção (base: {insights?.baseadoEm.totalRespostas || 0} respostas)
            </p>
            <div className="nr1-nuvem">
              {(dados.nuvemPalavras || []).slice(0, 20).map((p, i) => {
                const maxC = Math.max(...(dados.nuvemPalavras || [{ contagem: 1 }]).map((x) => x.contagem));
                const size = 14 + (p.contagem / maxC) * 20;
                const isBold = p.contagem / maxC > 0.6;
                return (
                  <span
                    key={i}
                    className="nr1-nuvem-palavra"
                    style={{ fontSize: `${size}px`, fontWeight: isBold ? 700 : 500 }}
                  >
                    {p.texto}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Diagnóstico Marcia */}
          <div className="nr1-marcia-box">
            <div className="nr1-marcia-header">
              <p className="nr1-marcia-titulo">Marci.A — Síntese Diagnóstica</p>
              <span className="nr1-marcia-online">● Online</span>
            </div>
            <p className="nr1-marcia-sub">
              Análise baseada em {dados.jornadasConcluidas} jornadas de {dados.totalProfessores} professores · {insights?.baseadoEm.totalRespostas || 0} respostas
            </p>

            <div className="nr1-marcia-bloco nr1-marcia-diagnostico">
              <p className="nr1-marcia-label">DIAGNÓSTICO PRINCIPAL</p>
              <p className="nr1-marcia-texto">
                {insights?.dores.resumo || 'Sem dados suficientes para diagnóstico.'}
              </p>
            </div>

            <div className="nr1-marcia-bloco nr1-marcia-positivo">
              <p className="nr1-marcia-label">IMPACTO POSITIVO REGISTRADO</p>
              <p className="nr1-marcia-texto">
                {insights?.beneficios.resumo || 'Sem dados suficientes.'}
              </p>
            </div>
          </div>

          {/* Seção 5.6 — Registro */}
          <p className="nr1-eyebrow" style={{ marginTop: '32px' }}>SEÇÃO 5.6 — REGISTRO OBRIGATÓRIO (NR-1 ITEM 1.5.7)</p>
          <h2 className="nr1-h2">Controle de Versão & Arquivo</h2>

          <div className="nr1-arquivo-box">
            <div className="nr1-arquivo-main">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5A4B" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <div>
                <p className="nr1-arquivo-titulo">Registro de Arquivo — Obrigatório por 20 anos (NR-1 item 1.5.7)</p>
                <p className="nr1-arquivo-texto">
                  Este documento deve ser arquivado em formato digital (PDF/A) e físico, com controle de versão, pelo período mínimo
                  de 20 anos a contar da data de emissão, conforme exigência da NR-1. Deve estar disponível para apresentação
                  imediata em caso de fiscalização pelo MTE a partir de 26/05/2026.
                </p>
              </div>
            </div>
            <div className="nr1-arquivo-meta">
              <div>
                <p className="nr1-meta-label">DATA DE EMISSÃO</p>
                <p className="nr1-meta-valor-pequeno">{dataEmissao}</p>
              </div>
              <div>
                <p className="nr1-meta-label">ARQUIVO ATÉ</p>
                <p className="nr1-meta-valor-pequeno">{dataArquivo}</p>
              </div>
              <div>
                <p className="nr1-meta-label">VERSÃO</p>
                <p className="nr1-meta-valor-pequeno">v1.0 — Piloto Q1</p>
              </div>
            </div>
          </div>

          <table className="nr1-tabela nr1-tabela-compacta">
            <thead>
              <tr>
                <th>VERSÃO</th>
                <th>DATA</th>
                <th>DESCRIÇÃO</th>
                <th>ELABORADO POR</th>
                <th>APROVADO POR</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>v1.0</strong></td>
                <td>{dataEmissao}</td>
                <td>Relatório piloto — {dados.totalProfessores} professores, {dados.jornadasConcluidas} jornadas. Primeiro ciclo de avaliação psicossocial.</td>
                <td>EmpatIA (Plataforma)</td>
                <td style={{ color: '#9ca3af' }}>___________________</td>
              </tr>
              <tr>
                <td>v2.0</td>
                <td>{proximaRevisaoStr}</td>
                <td>Revisão trimestral — comparação com baseline. Verificação de eficácia do plano de ação.</td>
                <td>EmpatIA (Plataforma)</td>
                <td style={{ color: '#9ca3af' }}>___________________</td>
              </tr>
            </tbody>
          </table>

          {/* Assinaturas */}
          <p className="nr1-eyebrow" style={{ marginTop: '32px' }}>VALIDAÇÃO DO DOCUMENTO</p>
          <h2 className="nr1-h2">Assinaturas e Responsabilidades</h2>

          <div className="nr1-assinaturas-grid">
            <div className="nr1-assinatura-card">
              <p className="nr1-assinatura-label">Elaboração</p>
              <div className="nr1-assinatura-linha" />
              <p className="nr1-assinatura-nome"><strong>EmpatIA — Plataforma</strong></p>
              <p className="nr1-assinatura-sub">Geração automática via MarcIA</p>
              <p className="nr1-assinatura-data">{dataEmissao}</p>
            </div>
            <div className="nr1-assinatura-card">
              <p className="nr1-assinatura-label">Responsável Técnico SST</p>
              <div className="nr1-assinatura-linha" />
              <p className="nr1-assinatura-nome">___________________________</p>
              <p className="nr1-assinatura-sub">Técnico de Segurança / Médico do Trabalho</p>
              <p className="nr1-assinatura-data">CREA/CRM: _______________</p>
            </div>
            <div className="nr1-assinatura-card">
              <p className="nr1-assinatura-label">Aprovação da Instituição</p>
              <div className="nr1-assinatura-linha" />
              <p className="nr1-assinatura-nome">___________________________</p>
              <p className="nr1-assinatura-sub">Diretor(a) — Rede Dinâmica de Ensino</p>
              <p className="nr1-assinatura-data">Data: _____/_____/{hoje.getFullYear()}</p>
            </div>
          </div>

          <div className="nr1-nota-legal">
            <p className="nr1-nota-legal-titulo">NOTA LEGAL E METODOLÓGICA</p>
            <p>
              Este documento constitui a Seção 5 (Fatores de Risco Psicossocial) do PGR, conforme item 1.5.4.4(e) da NR-1 (Portaria MTE nº 1.419/2024). Dados coletados de forma
              anônima e agregada pela plataforma EmpatIA, mediante consentimento livre e esclarecido (LGPD Art. 11). Dados individuais nunca são identificados à gestão.
              Instrumentos utilizados: IPCS, IBED, Escala de IE (15–75), IRPE e análise conversacional via MarcIA (IA). Este documento não substitui avaliação clínica individual, não
              configura diagnóstico médico e não dispensa a complementação por AEP/AET quando exigida pelo técnico de SST responsável. Deve ser integrado ao PGR vigente da
              instituição e arquivado pelo mínimo de 20 anos (NR-1 item 1.5.7). Elaborado em conformidade com a Portaria MTE nº 1.419/2024 e a LGPD (Lei 13.709/2018).
            </p>
          </div>

          <div className="nr1-footer-final">
            <span>EmpatIA · PGR-Ready</span>
            <span>Seção 5 — Riscos Psicossociais · Rede Dinâmica de Ensino · {dataEmissao}</span>
            <span>v1.0 · Confidencial</span>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

// Componente auxiliar para linhas de emoção/comunicação
function EmocaoLinha({ emoji, nome, perc, qtd, cor, noQtd }: {
  emoji?: string;
  nome: string;
  perc: number;
  qtd?: number;
  cor: string;
  noQtd?: boolean;
}) {
  return (
    <div className="nr1-emocao-linha">
      <span className="nr1-emocao-nome">
        {emoji && <span className="nr1-emocao-emoji">{emoji}</span>}
        {nome}
      </span>
      <div className="nr1-emocao-bar-container">
        <div className="nr1-emocao-bar" style={{ width: `${perc}%`, background: cor }} />
      </div>
      <span className="nr1-emocao-perc">{perc.toFixed(0)}%</span>
      {!noQtd && <span className="nr1-emocao-qtd">{qtd ?? 0} prof.</span>}
    </div>
  );
}
