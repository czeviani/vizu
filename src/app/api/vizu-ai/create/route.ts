import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import type { AICreateRequest, Presentation } from '@/types/slide';
import { DEFAULT_THEMES } from '@/lib/themes';
import { buildSlideFromSpec } from '@/lib/templates';

/**
 * POST /api/vizu-ai/create
 *
 * Cria uma apresentação completa em uma única chamada a partir de um spec JSON.
 * Equivalente ao /api/ai/create mas com melhor documentação e respostas em português.
 *
 * Use este endpoint quando você já sabe toda a estrutura da apresentação de antemão.
 * Para criação iterativa com controle fino, prefira POST /api/vizu-ai/execute.
 *
 * Body:
 * {
 *   "title": "Título da Apresentação",
 *   "theme": { "id": "midnight" },
 *   "slides": [
 *     { "layout": "cover", "data": { "title": "Título", "subtitle": "Subtítulo", "author": "Autor" } },
 *     { "layout": "content", "data": { "title": "Slide", "bullets": ["Ponto 1", "Ponto 2"] } },
 *     { "layout": "closing", "data": { "title": "Obrigado", "subtitle": "Dúvidas?" } }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as AICreateRequest;

    if (!body.title) {
      return NextResponse.json(
        { erro: 'O campo "title" é obrigatório.' },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.slides) || body.slides.length === 0) {
      return NextResponse.json(
        { erro: 'O campo "slides" é obrigatório e deve ser um array não vazio.' },
        { status: 400 }
      );
    }

    const temaBase = DEFAULT_THEMES.find((t) => t.id === body.theme?.id) ?? DEFAULT_THEMES[0];
    const tema = body.theme
      ? {
          ...temaBase,
          ...body.theme,
          colors: { ...temaBase.colors, ...(body.theme.colors ?? {}) },
          fonts: { ...temaBase.fonts, ...(body.theme.fonts ?? {}) },
        }
      : temaBase;

    const now = new Date().toISOString();
    const apresentacao: Presentation = {
      id: uuid(),
      title: body.title,
      theme: tema,
      slides: body.slides.map((spec) => buildSlideFromSpec(spec, tema)),
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0',
        author: 'IA (Claude Code)',
      },
    };

    return NextResponse.json(
      { apresentacao, total_slides: apresentacao.slides.length },
      { status: 201 }
    );
  } catch (err) {
    console.error('[vizu-ai/create]', err);
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 });
  }
}
