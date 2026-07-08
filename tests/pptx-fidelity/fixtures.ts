import { v4 as uuid } from 'uuid';
import type {
  Presentation, Slide, TextElement, ShapeElement, ImageElement, IconElement,
  TableElement, LineElement, ChartElement, BorderStyle, ShadowStyle, TextStyle,
} from '@/types/slide';
import { getThemeById } from '@/lib/themes';
import { BUILT_IN_TEMPLATES, materializeTemplate } from '@/lib/templateLibrary';

// PNG 1x1 transparente — usado nos fixtures de imagem para não depender de rede.
export const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const noBorder: BorderStyle = { width: 0, color: 'transparent', style: 'none', radius: 0 };
const noShadow: ShadowStyle = { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' };

const baseTextStyle: TextStyle = {
  fontFamily: 'Inter',
  fontSize: 24,
  fontWeight: 400,
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#0f172a',
  textAlign: 'left',
  lineHeight: 1.4,
  letterSpacing: 0,
  textTransform: 'none',
};

function text(overrides: Partial<TextElement> & Pick<TextElement, 'x' | 'y' | 'width' | 'height' | 'content'>): TextElement {
  return {
    id: uuid(),
    type: 'text',
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    visible: true,
    background: 'transparent',
    border: noBorder,
    padding: 8,
    verticalAlign: 'top',
    style: baseTextStyle,
    ...overrides,
  };
}

function shape(overrides: Partial<ShapeElement> & Pick<ShapeElement, 'x' | 'y' | 'width' | 'height' | 'fill'>): ShapeElement {
  return {
    id: uuid(),
    type: 'shape',
    shape: 'rectangle',
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    border: noBorder,
    shadow: noShadow,
    ...overrides,
  };
}

function image(overrides: Partial<ImageElement> & Pick<ImageElement, 'x' | 'y' | 'width' | 'height' | 'src'>): ImageElement {
  return {
    id: uuid(),
    type: 'image',
    alt: '',
    objectFit: 'cover',
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    border: noBorder,
    shadow: noShadow,
    ...overrides,
  };
}

function icon(overrides: Partial<IconElement> & Pick<IconElement, 'x' | 'y' | 'width' | 'height' | 'iconName'>): IconElement {
  return {
    id: uuid(),
    type: 'icon',
    color: '#000000',
    background: 'transparent',
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    border: noBorder,
    ...overrides,
  };
}

function table(overrides: Partial<TableElement> & Pick<TableElement, 'x' | 'y' | 'width' | 'height' | 'rows'>): TableElement {
  return {
    id: uuid(),
    type: 'table',
    headerRow: true,
    headerCol: false,
    borderColor: '#e2e8f0',
    headerBackground: '#0f172a',
    headerTextColor: '#ffffff',
    alternateRowColor: true,
    alternateColor: '#f8fafc',
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    ...overrides,
  };
}

function line(overrides: Partial<LineElement> & Pick<LineElement, 'x' | 'y' | 'width' | 'height'>): LineElement {
  return {
    id: uuid(),
    type: 'line',
    color: '#0f172a',
    thickness: 2,
    style: 'solid',
    arrowStart: false,
    arrowEnd: false,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    ...overrides,
  };
}

function chart(overrides: Partial<ChartElement> & Pick<ChartElement, 'x' | 'y' | 'width' | 'height' | 'chartType'>): ChartElement {
  return {
    id: uuid(),
    type: 'chart',
    labels: ['Jan', 'Fev', 'Mar'],
    series: [{ name: 'Série 1', values: [10, 20, 30] }],
    colors: ['3b82f6'],
    showLegend: true,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    ...overrides,
  };
}

export function presentation(title: string, slides: Slide[], themeId = 'slate'): Presentation {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title,
    theme: getThemeById(themeId),
    slides,
    metadata: { createdAt: now, updatedAt: now, version: '1.0' },
  };
}

// 1 — todos os tipos de elemento em um único slide
export const fixtureAllElementTypes: Presentation = presentation('Fixture — Todos os Elementos', [
  {
    id: uuid(),
    layout: 'blank',
    background: { type: 'color', color: '#ffffff' },
    elements: [
      text({ x: 40, y: 20, width: 300, height: 60, content: 'Título de teste', zIndex: 1 }),
      shape({ x: 40, y: 100, width: 150, height: 100, fill: '#3b82f6', zIndex: 2 }),
      image({ x: 220, y: 100, width: 100, height: 100, src: TINY_PNG, zIndex: 3 }),
      icon({ x: 340, y: 100, width: 48, height: 48, iconName: 'star', zIndex: 4 }),
      line({ x: 40, y: 230, width: 200, height: 0, zIndex: 5 }),
      table({
        x: 40, y: 260, width: 400, height: 120,
        rows: [
          [{ content: 'A', style: {}, background: 'transparent' }, { content: 'B', style: {}, background: 'transparent' }],
          [{ content: '1', style: {}, background: 'transparent' }, { content: '2', style: {}, background: 'transparent' }],
        ],
        zIndex: 6,
      }),
      chart({ x: 480, y: 20, width: 350, height: 300, chartType: 'bar', zIndex: 7 }),
    ],
  },
], 'slate');

// 2 — rotações e opacidades variadas
export const fixtureRotationOpacity: Presentation = presentation('Fixture — Rotação e Opacidade', [
  {
    id: uuid(),
    layout: 'blank',
    background: { type: 'color', color: '#ffffff' },
    elements: [
      shape({ x: 40, y: 40, width: 120, height: 80, fill: '#f43f5e', rotation: 0, opacity: 1, zIndex: 1 }),
      shape({ x: 200, y: 40, width: 120, height: 80, fill: '#f43f5e', rotation: 15, opacity: 0.5, zIndex: 2 }),
      shape({ x: 360, y: 40, width: 120, height: 80, fill: '#f43f5e', rotation: 45, opacity: 0.25, zIndex: 3 }),
      shape({ x: 520, y: 40, width: 120, height: 80, fill: '#f43f5e', rotation: 90, opacity: 0.75, zIndex: 4 }),
      shape({ x: 40, y: 160, width: 120, height: 80, fill: '#f43f5e', rotation: 270, opacity: 1, zIndex: 5 }),
      image({ x: 200, y: 160, width: 120, height: 80, src: TINY_PNG, rotation: 30, opacity: 0.6, zIndex: 6 }),
      text({ x: 360, y: 160, width: 200, height: 60, content: 'Rotacionado', rotation: 10, opacity: 0.8, zIndex: 7 }),
    ],
  },
], 'slate');

// 3 — ordem de empilhamento (z-index)
export const fixtureZOrder: Presentation = presentation('Fixture — Z-Order', [
  {
    id: uuid(),
    layout: 'blank',
    background: { type: 'color', color: '#ffffff' },
    elements: [
      shape({ id: 'z-top', x: 120, y: 60, width: 100, height: 100, fill: '#22c55e', zIndex: 30 }),
      shape({ id: 'z-bottom', x: 40, y: 20, width: 100, height: 100, fill: '#3b82f6', zIndex: 1 }),
      shape({ id: 'z-mid', x: 80, y: 40, width: 100, height: 100, fill: '#f59e0b', zIndex: 15 }),
    ],
  },
], 'slate');

// 4 — listas estruturadas (bullets nativos) e notas do apresentador
export const fixtureListsNotes: Presentation = presentation('Fixture — Listas e Notas', [
  {
    id: uuid(),
    layout: 'blank',
    background: { type: 'color', color: '#ffffff' },
    elements: [
      text({
        x: 40, y: 40, width: 500, height: 200,
        content: '• Primeiro item\n• Segundo item\n• Terceiro item',
        zIndex: 1,
      }),
    ],
    notes: 'Estas são as notas do apresentador para o slide de teste.',
  },
], 'slate');

// 5 — fundos: cor sólida, gradiente (fallback) e imagem
export const fixtureBackgrounds: Presentation = presentation('Fixture — Fundos', [
  {
    id: uuid(),
    layout: 'blank',
    background: { type: 'color', color: '#0ea5e9' },
    elements: [text({ x: 40, y: 40, width: 300, height: 60, content: 'Fundo cor sólida' })],
  },
  {
    id: uuid(),
    layout: 'blank',
    background: { type: 'gradient', gradient: { from: '#f43f5e', to: '#8b5cf6', direction: 45 } },
    elements: [text({ x: 40, y: 40, width: 300, height: 60, content: 'Fundo gradiente (fallback)' })],
  },
  {
    id: uuid(),
    layout: 'blank',
    background: { type: 'image', image: TINY_PNG },
    elements: [text({ x: 40, y: 40, width: 300, height: 60, content: 'Fundo imagem' })],
  },
], 'slate');

// 6 — template completo "Institucional Gerdau"
export const fixtureGerdauTemplate: Presentation = (() => {
  const tpl = BUILT_IN_TEMPLATES.find((t) => t.id === 'builtin-institucional-gerdau');
  if (!tpl) throw new Error('Template Institucional Gerdau não encontrado em BUILT_IN_TEMPLATES');
  return presentation('Institucional Gerdau', materializeTemplate(tpl), 'gerdau');
})();

export const ALL_FIXTURES = [
  { name: 'all-element-types', presentation: fixtureAllElementTypes },
  { name: 'rotation-opacity', presentation: fixtureRotationOpacity },
  { name: 'z-order', presentation: fixtureZOrder },
  { name: 'lists-notes', presentation: fixtureListsNotes },
  { name: 'backgrounds', presentation: fixtureBackgrounds },
  { name: 'gerdau-template', presentation: fixtureGerdauTemplate },
];
