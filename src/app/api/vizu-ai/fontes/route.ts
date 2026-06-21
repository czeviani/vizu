import { NextResponse } from 'next/server';

/**
 * GET /api/vizu-ai/fontes
 *
 * Retorna as fontes disponíveis no Vizu.
 */
export async function GET() {
  const fontes = [
    {
      id: 'Inter',
      nome: 'Inter',
      categoria: 'sans-serif',
      descricao: 'Fonte padrão do Vizu. Altamente legível em qualquer tamanho. Ideal para headings e body.',
      melhor_para: ['corporativo', 'tecnologia', 'geral'],
      pesos_disponiveis: [300, 400, 500, 600, 700, 800],
    },
    {
      id: 'Georgia',
      nome: 'Georgia',
      categoria: 'serif',
      descricao: 'Serif clássico. Transmite tradição e confiança. Ótimo para citações e headlines editoriais.',
      melhor_para: ['editorial', 'institucional', 'citações'],
      pesos_disponiveis: [400, 700],
    },
    {
      id: 'monospace',
      nome: 'Monospace (system)',
      categoria: 'monospace',
      descricao: 'Fonte monoespaçada do sistema. Ideal para código, dados técnicos e versão mono.',
      melhor_para: ['tecnologia', 'código', 'dados'],
      pesos_disponiveis: [400, 700],
    },
  ];

  const escala_tipografica = [
    { contexto: 'Título de capa',        fonte_recomendada: 'Inter', peso: 700, tamanho: 52, espaco_letras: -0.5 },
    { contexto: 'Título de seção',       fonte_recomendada: 'Inter', peso: 700, tamanho: 44, espaco_letras: -0.3 },
    { contexto: 'Título de slide',       fonte_recomendada: 'Inter', peso: 700, tamanho: 30, espaco_letras: -0.2 },
    { contexto: 'Subtítulo',             fonte_recomendada: 'Inter', peso: 400, tamanho: 22, espaco_letras: 0   },
    { contexto: 'Corpo / bullets',       fonte_recomendada: 'Inter', peso: 400, tamanho: 20, espaco_letras: 0   },
    { contexto: 'Dado numérico grande',  fonte_recomendada: 'Inter', peso: 800, tamanho: 64, espaco_letras: -1  },
    { contexto: 'Legenda / meta',        fonte_recomendada: 'Inter', peso: 400, tamanho: 14, espaco_letras: 0.5 },
    { contexto: 'Citação',               fonte_recomendada: 'Inter', peso: 300, tamanho: 28, espaco_letras: 0   },
  ];

  const pares_recomendados = [
    { heading: 'Inter', body: 'Inter', descricao: 'Padrão — consistência máxima' },
    { heading: 'Georgia', body: 'Inter', descricao: 'Editorial — títulos com personalidade, corpo limpo' },
  ];

  return NextResponse.json({ fontes, escala_tipografica, pares_recomendados });
}
