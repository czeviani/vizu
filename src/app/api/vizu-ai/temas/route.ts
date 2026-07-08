import { NextResponse } from 'next/server';
import { DEFAULT_THEMES } from '@/lib/themes';

/**
 * GET /api/vizu-ai/temas
 *
 * Retorna todos os temas disponíveis com seus tokens de cor.
 * A IA deve consultar este endpoint antes de criar uma apresentação.
 */
export async function GET() {
  const temas = DEFAULT_THEMES.map((t) => ({
    id: t.id,
    nome: t.name,
    fontes: t.fonts,
    cores: t.colors,
    preview_textual: descreverTema(t.id),
    uso_recomendado: recomendarUso(t.id),
  }));

  return NextResponse.json({ temas, total: temas.length });
}

function descreverTema(id: string): string {
  const descricoes: Record<string, string> = {
    slate:    'Azul corporativo sobre fundo branco. Tom profissional e limpo.',
    midnight: 'Roxo/índigo e rosa sobre fundo escuro (#0f172a). Elegante e moderno.',
    forest:   'Verde-esmeralda sobre fundo branco. Tom orgânico e sustentável.',
    rose:     'Vermelho/rosa sobre fundo branco. Enérgico e criativo.',
    ocean:    'Azul-céu sobre fundo branco. Leve e tecnológico.',
    mono:     'Preto sobre off-white. Minimalista e editorial.',
    gerdau:   'Azul institucional (#003DA5) e amarelo (#FFC72C) sobre fundo off-white, tipografia Archivo. Identidade corporativa Gerdau.',
  };
  return descricoes[id] ?? 'Tema personalizado.';
}

function recomendarUso(id: string): string {
  const usos: Record<string, string> = {
    slate:    'Relatórios corporativos, pitchs, apresentações formais.',
    midnight: 'Tecnologia, startups, eventos noturnos, produtos digitais.',
    forest:   'Sustentabilidade, saúde, educação, natureza.',
    rose:     'Lançamentos, marketing, criatividade, moda.',
    ocean:    'SaaS, finanças, viagem, bem-estar.',
    mono:     'Editorial, portfólio, design, arquitetura.',
    gerdau:   'Apresentações institucionais e corporativas da Gerdau.',
  };
  return usos[id] ?? 'Uso geral.';
}
