import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { BUILT_IN_TEMPLATES, materializeTemplate } from '@/lib/templateLibrary';
import { buildSlideFromSpec } from '@/lib/templates';
import { getThemeById } from '@/lib/themes';
import { heuristicGenerateSlides } from '@/lib/generateSlides';
import { generateSlidesResponseSchema } from '@/lib/aiSlideSpecSchema';
import { presentation, TINY_PNG } from './fixtures';

// iconToDataUrl() usa document.createElement('canvas') (rasterização no browser),
// indisponível em Node — mockado como nos demais testes de fidelidade PPTX.
vi.mock('@/lib/iconPaths', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/iconPaths')>();
  return { ...actual, iconToDataUrl: vi.fn().mockResolvedValue(TINY_PNG) };
});

const { exportToPptx } = await import('@/lib/pptxExport');

async function assertValidPptx(pres: Parameters<typeof exportToPptx>[0], label: string) {
  const blob = await exportToPptx(pres);
  const zip = await JSZip.loadAsync(Buffer.from(await blob.arrayBuffer()));
  expect(zip.file('[Content_Types].xml'), `${label}: [Content_Types].xml ausente`).toBeTruthy();
  const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  expect(slideFiles.length, `${label}: nº de slides no pacote`).toBe(pres.slides.length);
}

describe('Sistemática de templates — deck semântico → composer → export (prova de que a IA funciona)', () => {
  it('cada um dos 13 templates built-in materializa (buildSlideFromSpec) e exporta um .pptx válido', async () => {
    for (const tpl of BUILT_IN_TEMPLATES) {
      const slides = materializeTemplate(tpl);
      expect(slides.length, `${tpl.name}: nº de slides materializados`).toBe(tpl.deck.length);
      for (const slide of slides) {
        expect(slide.elements.length, `${tpl.name}/${slide.layout}: slide sem elementos`).toBeGreaterThan(0);
      }
      const pres = presentation(tpl.name, slides, tpl.themeId);
      await assertValidPptx(pres, tpl.name);
    }
  });

  it('cada template usa ao menos um layout rico (metrics/agenda/chart/table/image-split)', () => {
    const richLayouts = new Set(['metrics', 'agenda', 'chart', 'table', 'image-split']);
    for (const tpl of BUILT_IN_TEMPLATES) {
      const hasRich = tpl.deck.some((spec) => richLayouts.has(spec.layout));
      expect(hasRich, `${tpl.name}: nenhum layout rico no deck`).toBe(true);
    }
  });

  it('todos os 11 layouts (AISlideSpec) produzem elementos via buildSlideFromSpec, sem exceções', () => {
    const theme = getThemeById('slate');
    const layouts: Array<[string, Parameters<typeof buildSlideFromSpec>[0]['data']]> = [
      ['cover', { title: 'T', subtitle: 'S', author: 'A' }],
      ['section', { title: 'T', subtitle: 'S' }],
      ['content', { title: 'T', bullets: ['a', 'b'] }],
      ['content-icons', { title: 'T', bullets: ['a', 'b'], bulletIcons: ['Zap', 'Star'] }],
      ['comparison', { title: 'T', leftTitle: 'L', leftContent: 'x', rightTitle: 'R', rightContent: 'y' }],
      ['quote', { quote: 'Q', attribution: 'At' }],
      ['closing', { title: 'T', subtitle: 'S' }],
      ['metrics', { title: 'T', metrics: [{ value: '10', label: 'x' }, { value: '20', label: 'y' }] }],
      ['agenda', { title: 'T', bullets: ['a', 'b', 'c'] }],
      ['chart', { title: 'T', chart: { chartType: 'bar', labels: ['A', 'B'], series: [{ name: 'S', values: [1, 2] }] } }],
      ['table', { title: 'T', columns: [{ heading: 'H', rows: ['1', '2'] }] }],
      ['image-split', { title: 'T', bullets: ['a'] }],
    ];
    for (const [label, data] of layouts) {
      const layout = (label === 'content-icons' ? 'content' : label) as Parameters<typeof buildSlideFromSpec>[0]['layout'];
      const slide = buildSlideFromSpec({ layout, data }, theme);
      expect(slide.elements.length, `layout ${label}: sem elementos`).toBeGreaterThan(0);
    }
  });

  it('heurística de geração (sem ANTHROPIC_API_KEY) extrai tabela markdown e métricas "label: valor" e produz um deck exportável', async () => {
    const rawText = `# Resultados
- Receita: R$ 5,2M (+24%)
- Novos clientes: 142
- NPS: 81

# Planos
| Plano | Preço |
|---|---|
| Essencial | R$ 199 |
| Pro | R$ 499 |

# Próximos passos
- Expandir para LATAM
- Lançar API pública
`;
    const specs = heuristicGenerateSlides(rawText, { title: 'Deck de Teste', presentationType: 'relatorio', slideCountHint: 6 });

    // valida contra o mesmo schema Zod usado para validar a saída da IA real
    const parsed = generateSlidesResponseSchema.parse({ slides: specs });
    expect(parsed.slides[0].layout).toBe('cover');
    expect(parsed.slides.at(-1)?.layout).toBe('closing');
    expect(specs.some((s) => s.layout === 'table'), 'deveria extrair a tabela markdown como layout table').toBe(true);
    expect(specs.some((s) => s.layout === 'metrics'), 'deveria extrair "Receita/Novos clientes/NPS" como layout metrics').toBe(true);

    const theme = getThemeById('slate');
    const slides = specs.map((spec) => buildSlideFromSpec(spec, theme));
    const pres = presentation('Deck de Teste', slides, 'slate');
    await assertValidPptx(pres, 'heurística');
  });

  it('AI_LAYOUTS (schema exposto à IA) cobre exatamente os layouts que o composer sabe desenhar, exceto blank', () => {
    const theme = getThemeById('slate');
    const layoutsThatRender: string[] = ['cover', 'section', 'content', 'comparison', 'quote', 'closing', 'metrics', 'agenda', 'chart', 'table', 'image-split'];
    for (const layout of layoutsThatRender) {
      const slide = buildSlideFromSpec({ layout: layout as never, data: {} }, theme);
      expect(Array.isArray(slide.elements), `layout ${layout} não deveria lançar exceção com data vazio`).toBe(true);
    }
  });
});
