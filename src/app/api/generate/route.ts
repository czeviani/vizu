import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import type { Presentation } from '@/types/slide';
import { DEFAULT_THEMES } from '@/lib/themes';
import { buildSlideFromSpec } from '@/lib/templates';
import { aiGenerateSlides, heuristicGenerateSlides, type PresentationType } from '@/lib/generateSlides';

/**
 * Wizard "Nova Apresentação com IA" — gera um deck completo a partir de dados
 * colados pelo usuário. Camada 1 (IA) devolve apenas conteúdo semântico
 * (AISlideSpec[], sem coordenadas); Camada 2 (buildSlideFromSpec, motor
 * determinístico) calcula o layout visual. Sem ANTHROPIC_API_KEY configurada,
 * cai no parser heurístico de markdown/outline.
 *
 * POST /api/generate
 * Body: { title: string; rawText: string; presentationType: 'relatorio'|'pitch'|'treinamento'|'outro';
 *         slideCountHint?: number; themeId?: string }
 */

const requestSchema = z.object({
  title: z.string().min(1).max(160),
  rawText: z.string().min(1).max(20000),
  presentationType: z.enum(['relatorio', 'pitch', 'treinamento', 'outro']),
  slideCountHint: z.number().int().min(3).max(24).optional(),
  themeId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Requisição inválida', details: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }

  const opts = {
    title: body.title,
    presentationType: body.presentationType as PresentationType,
    slideCountHint: body.slideCountHint ?? 8,
  };

  let source: 'ai' | 'heuristic' = 'heuristic';
  let specs;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      specs = await aiGenerateSlides(body.rawText, opts);
      source = 'ai';
    } catch (err) {
      console.error('[api/generate] aiGenerateSlides falhou, usando fallback heurístico:', err);
      specs = heuristicGenerateSlides(body.rawText, opts);
    }
  } else {
    specs = heuristicGenerateSlides(body.rawText, opts);
  }

  const theme = DEFAULT_THEMES.find((t) => t.id === body.themeId) ?? DEFAULT_THEMES[0];
  const now = new Date().toISOString();
  const presentation: Presentation = {
    id: uuid(),
    title: body.title,
    theme,
    slides: specs.map((spec) => buildSlideFromSpec(spec, theme)),
    metadata: { createdAt: now, updatedAt: now, version: '1.0' },
  };

  return NextResponse.json({ presentation, source }, { status: 201 });
}
