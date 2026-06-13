import { NextRequest, NextResponse } from 'next/server';
import type { AIModifyRequest, Presentation, Slide } from '@/types/slide';
import { DEFAULT_THEMES } from '@/lib/themes';
import { buildSlideFromSpec } from '@/lib/templates';

/**
 * AI Modify endpoint — Claude Code calls this to modify an existing presentation.
 *
 * POST /api/ai/modify
 * Body: AIModifyRequest
 *
 * The caller must provide the full current presentation JSON as `presentationData`
 * alongside the operations array (since we have no persistent server store by default).
 *
 * Example:
 * {
 *   "presentationData": { ...current presentation object... },
 *   "operations": [
 *     { "op": "set-title", "title": "New Title" },
 *     { "op": "add-slide", "position": 2, "spec": { "layout": "content", "data": { "title": "New Slide" } } },
 *     { "op": "update-element", "slideId": "abc", "elementId": "def", "props": { "content": "Updated text" } }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { presentationData: Presentation; operations: AIModifyRequest['operations'] };
    let p: Presentation = body.presentationData;

    if (!p || !p.id) {
      return NextResponse.json({ error: 'presentationData with id is required' }, { status: 400 });
    }

    for (const op of body.operations ?? []) {
      switch (op.op) {
        case 'set-title':
          p = { ...p, title: op.title };
          break;

        case 'set-theme': {
          const base = DEFAULT_THEMES.find((t) => t.id === op.theme.id) ?? p.theme;
          p = { ...p, theme: { ...base, ...op.theme, colors: { ...base.colors, ...(op.theme.colors ?? {}) }, fonts: { ...base.fonts, ...(op.theme.fonts ?? {}) } } };
          break;
        }

        case 'add-slide': {
          const newSlide = buildSlideFromSpec(op.spec, p.theme);
          const slides = [...p.slides];
          slides.splice(op.position, 0, newSlide);
          p = { ...p, slides };
          break;
        }

        case 'remove-slide':
          p = { ...p, slides: p.slides.filter((s) => s.id !== op.slideId) };
          break;

        case 'update-slide': {
          const updatedSlide = buildSlideFromSpec(op.spec as Parameters<typeof buildSlideFromSpec>[0], p.theme);
          p = {
            ...p,
            slides: p.slides.map((s) =>
              s.id === op.slideId
                ? { ...s, ...op.spec, background: op.spec.background ? { ...s.background, ...op.spec.background } : s.background }
                : s
            ),
          };
          break;
        }

        case 'update-element':
          p = {
            ...p,
            slides: p.slides.map((s) =>
              s.id === op.slideId
                ? {
                    ...s,
                    elements: s.elements.map((el) =>
                      el.id === op.elementId ? { ...el, ...op.props } : el
                    ),
                  }
                : s
            ),
          };
          break;

        case 'reorder-slides': {
          const slideMap = new Map(p.slides.map((s) => [s.id, s]));
          const reordered = op.order.map((id) => slideMap.get(id)).filter(Boolean) as Slide[];
          p = { ...p, slides: reordered };
          break;
        }
      }
    }

    p = { ...p, metadata: { ...p.metadata, updatedAt: new Date().toISOString() } };
    return NextResponse.json(p);
  } catch (err) {
    console.error('[ai/modify]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
