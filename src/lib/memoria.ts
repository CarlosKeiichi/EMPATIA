import { prisma } from './db';

/**
 * Constrói o contexto de memória da Márcia para um professor.
 * Reúne jornadas, diagnósticos, estados emocionais e pontos de atenção
 * para que a IA tenha continuidade entre conversas.
 */
export async function construirMemoriaMarcia(professorId: string): Promise<string> {
  // Buscar dados do professor
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
    include: { user: { select: { nome: true } } },
  });
  if (!professor) return '';

  // Buscar jornadas concluídas (últimas 5)
  const jornadas = await prisma.jornada.findMany({
    where: { professorId, status: 'concluida' },
    include: { diagnostico: true },
    orderBy: { concluidaEm: 'desc' },
    take: 5,
  });

  // Buscar última conversa de suporte (se existir)
  const ultimaConversa = await prisma.conversa.findFirst({
    where: { professorId, tipo: 'suporte' },
    include: { mensagens: { orderBy: { criadaEm: 'desc' }, take: 6 } },
    orderBy: { criadaEm: 'desc' },
  });

  // Montar memória
  const partes: string[] = [];

  // Identidade
  const nome = professor.user.nome.split(' ')[0];
  partes.push(`NOME DO PROFESSOR(A): ${nome}`);

  // Dados demográficos relevantes
  const demografico: string[] = [];
  if (professor.genero) demografico.push(`Gênero: ${professor.genero}`);
  if (professor.faixaEtaria) demografico.push(`Idade: ${professor.faixaEtaria}`);
  if (professor.frequenciaAulas) demografico.push(`Frequência: ${professor.frequenciaAulas}`);
  if (professor.funcaoEnsino) demografico.push(`Ensino como função: ${professor.funcaoEnsino}`);
  if (demografico.length > 0) {
    partes.push(`PERFIL: ${demografico.join(', ')}`);
  }

  // Jornadas passadas
  if (jornadas.length > 0) {
    partes.push(`\nHISTÓRICO DE JORNADAS (${jornadas.length} concluída${jornadas.length > 1 ? 's' : ''}):`);

    const mapaEstado: Record<string, string> = {
      A: 'Fortalecido(a)',
      B: 'Esperançoso(a)',
      C: 'Em alerta',
      D: 'Cansado(a)',
      E: 'Sobrecarregado(a)',
    };

    for (const j of jornadas) {
      const data = j.concluidaEm
        ? new Date(j.concluidaEm).toLocaleDateString('pt-BR')
        : 'data desconhecida';
      const tipo = j.tipo.charAt(0).toUpperCase() + j.tipo.slice(1);
      const estadoI = mapaEstado[j.estadoEmocionalInicial || 'C'] || j.estadoEmocionalInicial;
      const estadoF = mapaEstado[j.estadoEmocionalFinal || 'C'] || j.estadoEmocionalFinal;

      let linha = `- ${tipo} (${data}): ${estadoI} → ${estadoF}`;
      if (j.nivelRisco) linha += ` | Risco: ${j.nivelRisco}`;

      partes.push(linha);

      // Diagnóstico
      if (j.diagnostico) {
        const d = j.diagnostico;
        if (d.resumoIA) {
          // Resumir para não explodir o contexto
          const resumoCurto = d.resumoIA.length > 200
            ? d.resumoIA.slice(0, 200) + '...'
            : d.resumoIA;
          partes.push(`  Resumo: ${resumoCurto}`);
        }
        if (d.pontosAtencao) {
          try {
            const pontos = JSON.parse(d.pontosAtencao) as string[];
            if (pontos.length > 0) {
              partes.push(`  Pontos de atenção: ${pontos.slice(0, 3).join('; ')}`);
            }
          } catch { /* ignora JSON inválido */ }
        }
        if (d.nivelEstresse) {
          partes.push(`  Estresse: ${d.nivelEstresse}`);
        }
      }
    }

    // Tendência emocional
    const estados = jornadas
      .map((j) => j.estadoEmocionalFinal)
      .filter(Boolean)
      .reverse(); // ordem cronológica
    if (estados.length >= 2) {
      const ultimo = estados[estados.length - 1];
      const penultimo = estados[estados.length - 2];
      const mapaNum: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const diff = (mapaNum[ultimo!] || 3) - (mapaNum[penultimo!] || 3);
      if (diff > 0) {
        partes.push(`\nTENDÊNCIA: Melhora emocional recente (${mapaEstado[penultimo!]} → ${mapaEstado[ultimo!]})`);
      } else if (diff < 0) {
        partes.push(`\nTENDÊNCIA: Piora emocional recente (${mapaEstado[penultimo!]} → ${mapaEstado[ultimo!]}) — aborde com cuidado`);
      } else {
        partes.push(`\nTENDÊNCIA: Estado emocional estável`);
      }
    }
  } else {
    partes.push('\nPRIMEIRA INTERAÇÃO: Este professor(a) ainda não completou nenhuma jornada. Acolha, apresente-se e ofereça ajuda.');
  }

  // Última conversa de suporte
  if (ultimaConversa && ultimaConversa.mensagens.length > 0) {
    const msgs = ultimaConversa.mensagens.reverse(); // cronológica
    const dataConversa = new Date(ultimaConversa.criadaEm).toLocaleDateString('pt-BR');
    partes.push(`\nÚLTIMA CONVERSA LIVRE (${dataConversa}):`);
    for (const m of msgs.slice(-4)) {
      const role = m.role === 'user' ? nome : 'Márcia';
      const conteudo = m.conteudo.length > 100 ? m.conteudo.slice(0, 100) + '...' : m.conteudo;
      partes.push(`  ${role}: ${conteudo}`);
    }
  }

  // Jornadas pendentes
  const jornadasFeitas = new Set(jornadas.map((j) => j.tipo));
  const pendentes = ['trabalho', 'relacionamentos', 'financas'].filter((t) => !jornadasFeitas.has(t));
  if (pendentes.length > 0 && jornadas.length > 0) {
    partes.push(`\nJORNADAS NÃO EXPLORADAS: ${pendentes.join(', ')} — pode sugerir naturalmente quando relevante`);
  }

  return partes.join('\n');
}
