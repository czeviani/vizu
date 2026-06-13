import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import type { AICreateRequest, Presentation } from '@/types/slide';
import { DEFAULT_THEMES } from '@/lib/themes';
import { buildSlideFromSpec } from '@/lib/templates';

/**
 * AI Create endpoint — Claude Code calls this to create a full presentation from a spec.
 *
 * POST /api/ai/create
 * Body: AICreateRequest (see src/types/slide.ts)
 *
 * Example:
 * {
 *   "title": "Q3 Business Review",
 *   "theme": { "id": "midnight" },
 *   "slides": [
 *     { "layout": "cover", "data": { "title": "Q3 Business Review", "subtitle": "2026", "author": "Caique Zeviani" }},
 *     { "layout": "content", "data": { "title": "Key Results", "bullets": ["Revenue +18%", "NPS 72", "Churn 2.1%"] }},
 *     { "layout": "closing", "data": { "title": "Thank You", "subtitle": "Questions?" }}
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as AICreateRequest;

    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!Array.isArray(body.slides) || body.slides.length === 0) {
      return NextResponse.json({ error: 'slides array is required and must not be empty' }, { status: 400 });
    }

    // Resolve theme
    const baseTheme = DEFAULT_THEMES.find((t) => t.id === body.theme?.id) ?? DEFAULT_THEMES[0];
    const theme = body.theme
      ? {
          ...baseTheme,
          ...body.theme,
          colors: { ...baseTheme.colors, ...(body.theme.colors ?? {}) },
          fonts: { ...baseTheme.fonts, ...(body.theme.fonts ?? {}) },
        }
      : baseTheme;

    const now = new Date().toISOString();
    const presentation: Presentation = {
      id: uuid(),
      title: body.title,
      theme,
      slides: body.slides.map((spec) => buildSlideFromSpec(spec, theme)),
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0',
        author: 'AI (Claude Code)',
      },
    };

    return NextResponse.json(presentation, { status: 201 });
  } catch (err) {
    console.error('[ai/create]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
