import { v4 as uuid } from 'uuid';
import type {
  Slide,
  SlideElement,
  TextElement,
  ShapeElement,
  IconElement,
  TableElement,
  TableCell,
  ChartElement,
  ImageElement,
  Theme,
  AISlideSpec,
  LayoutType,
} from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';

// Luminância relativa (WCAG) — usada para escolher o mais escuro entre dois tokens de
// cor do tema. Necessário porque `colors.text` é claro em temas escuros (ex.: midnight),
// então não pode ser assumido como "cor escura" ao usá-lo como fundo cheio de slide.
function relativeLuminance(hex: string): number {
  const m = hex.replace('#', '');
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function darkerOf(a: string, b: string): string {
  return relativeLuminance(a) <= relativeLuminance(b) ? a : b;
}

// setTheme (usePresentation.ts) reteme substituindo, por igualdade EXATA de string, qualquer
// cor que bata bit-a-bit com um token do tema antigo. Cores derivadas (ex.: darkerOf, ou um
// '#ffffff' fixo) podem colidir por coincidência com um token não relacionado (ex.: vários temas
// claros têm colors.background === '#ffffff') — nesse caso o valor derivado seria remapeado como
// se fosse aquele token, produzindo uma cor errada após a troca de tema. Perturbamos o último
// dígito hex em 1 unidade (mudança imperceptível) só quando há colisão, pra desambiguar.
function avoidTokenCollision(hex: string, theme: Theme): string {
  const collides = Object.values(theme.colors).some((t) => t.toLowerCase() === hex.toLowerCase());
  if (!collides) return hex;
  const last = hex.slice(-1);
  const val = parseInt(last, 16);
  if (Number.isNaN(val)) return hex;
  const next = (val === 0 ? 1 : val - 1).toString(16);
  return hex.slice(0, -1) + next;
}

// Cor de texto legível sobre um fundo cheio (ex.: capa de seção, encerramento).
// Substitui os antigos '#ffffff'/'rgba(255,255,255,…)' fixos, que ficavam ilegíveis
// quando o tema trocado tinha fundo claro (setTheme reteme o fill, não o texto que
// dependia dele visualmente).
function onColor(bgHex: string, theme: Theme, opts?: { muted?: boolean; mutedAlpha?: number }): string {
  const dark = relativeLuminance(bgHex) < 0.5;
  if (dark) return opts?.muted ? `rgba(255,255,255,${opts.mutedAlpha ?? 0.75})` : avoidTokenCollision('#ffffff', theme);
  return opts?.muted ? theme.colors.textSecondary : theme.colors.text;
}

const defaultText = (
  overrides: Partial<TextElement> & Pick<TextElement, 'x' | 'y' | 'width' | 'height' | 'content'>
): TextElement => ({
  id: uuid(),
  type: 'text',
  rotation: 0,
  opacity: 1,
  zIndex: 1,
  locked: false,
  visible: true,
  background: 'transparent',
  border: { width: 0, color: 'transparent', style: 'none', radius: 0 },
  padding: 8,
  verticalAlign: 'middle',
  style: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#0f172a',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none',
  },
  ...overrides,
});

const defaultShape = (
  overrides: Partial<ShapeElement> & Pick<ShapeElement, 'x' | 'y' | 'width' | 'height' | 'fill'>
): ShapeElement => ({
  id: uuid(),
  type: 'shape',
  shape: 'rectangle',
  rotation: 0,
  opacity: 1,
  zIndex: 0,
  locked: false,
  visible: true,
  border: { width: 0, color: 'transparent', style: 'none', radius: 0 },
  shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
  ...overrides,
});

const defaultIcon = (
  overrides: Partial<IconElement> & Pick<IconElement, 'x' | 'y' | 'width' | 'height' | 'iconName' | 'color'>
): IconElement => ({
  id: uuid(),
  type: 'icon',
  rotation: 0,
  opacity: 1,
  zIndex: 2,
  locked: false,
  visible: true,
  background: 'transparent',
  border: { width: 0, color: 'transparent', style: 'none', radius: 0 },
  ...overrides,
});

const defaultTable = (
  overrides: Partial<TableElement> & Pick<TableElement, 'x' | 'y' | 'width' | 'height' | 'rows'>
): TableElement => ({
  id: uuid(),
  type: 'table',
  rotation: 0,
  opacity: 1,
  zIndex: 2,
  locked: false,
  visible: true,
  headerRow: true,
  headerCol: false,
  borderColor: 'rgba(0,0,0,0.1)',
  headerBackground: '#0f172a',
  headerTextColor: '#ffffff',
  alternateRowColor: true,
  alternateColor: 'rgba(0,0,0,0.03)',
  ...overrides,
});

const defaultChart = (
  overrides: Partial<ChartElement> &
    Pick<ChartElement, 'x' | 'y' | 'width' | 'height' | 'chartType' | 'labels' | 'series' | 'colors'>
): ChartElement => ({
  id: uuid(),
  type: 'chart',
  rotation: 0,
  opacity: 1,
  zIndex: 2,
  locked: false,
  visible: true,
  showLegend: true,
  ...overrides,
});

const defaultImage = (
  overrides: Partial<ImageElement> & Pick<ImageElement, 'x' | 'y' | 'width' | 'height'>
): ImageElement => ({
  id: uuid(),
  type: 'image',
  src: '',
  alt: '',
  objectFit: 'cover',
  rotation: 0,
  opacity: 1,
  zIndex: 1,
  locked: false,
  visible: true,
  border: { width: 0, color: 'transparent', style: 'none', radius: 0 },
  shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
  ...overrides,
});

export function buildSlideFromSpec(spec: AISlideSpec, theme: Theme): Slide {
  const bg: import('@/types/slide').SlideBackground = { type: 'color', color: theme.colors.background, ...spec.background };
  const slide: Slide = {
    id: uuid(),
    layout: spec.layout,
    background: bg,
    elements: [],
  };

  const d = spec.data ?? {};
  const c = theme.colors;

  switch (spec.layout) {
    case 'cover':
      slide.elements = buildCoverElements(d, c, theme);
      break;
    case 'section':
      slide.elements = buildSectionElements(d, c, theme);
      break;
    case 'content':
      slide.elements = buildContentElements(d, c, theme);
      break;
    case 'comparison':
      slide.elements = buildComparisonElements(d, c, theme);
      break;
    case 'quote':
      slide.elements = buildQuoteElements(d, c, theme);
      break;
    case 'closing':
      slide.elements = buildClosingElements(d, c, theme);
      break;
    case 'metrics':
      slide.elements = buildMetricsElements(d, c, theme);
      break;
    case 'agenda':
      slide.elements = buildAgendaElements(d, c, theme);
      break;
    case 'chart':
      slide.elements = buildChartElements(d, c, theme);
      break;
    case 'table':
      slide.elements = buildTableElements(d, c, theme);
      break;
    case 'image-split':
      slide.elements = buildImageSplitElements(d, c, theme);
      break;
    default:
      slide.elements = [];
  }

  return slide;
}

function buildCoverElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const elements: SlideElement[] = [];

  // Accent bar
  elements.push(
    defaultShape({
      id: uuid(),
      x: 0,
      y: SLIDE_HEIGHT - 8,
      width: SLIDE_WIDTH,
      height: 8,
      fill: c.primary,
      zIndex: 2,
    })
  );

  // Title
  elements.push(
    defaultText({
      id: uuid(),
      x: 80,
      y: 160,
      width: SLIDE_WIDTH - 160,
      height: 120,
      content: d.title ?? 'Título da Apresentação',
      zIndex: 3,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 52,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: c.text,
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: -0.5,
        textTransform: 'none',
      },
    })
  );

  // Subtitle
  if (d.subtitle) {
    elements.push(
      defaultText({
        id: uuid(),
        x: 80,
        y: 295,
        width: SLIDE_WIDTH - 300,
        height: 60,
        content: d.subtitle,
        zIndex: 3,
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 22,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.textSecondary,
          textAlign: 'left',
          lineHeight: 1.4,
          letterSpacing: 0,
          textTransform: 'none',
        },
      })
    );
  }

  // Author / date
  const meta = [d.author, d.date].filter(Boolean).join(' · ');
  if (meta) {
    elements.push(
      defaultText({
        id: uuid(),
        x: 80,
        y: 420,
        width: 400,
        height: 40,
        content: meta,
        zIndex: 3,
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 14,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.textSecondary,
          textAlign: 'left',
          lineHeight: 1.4,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      })
    );
  }

  // Decorative shape
  elements.push(
    defaultShape({
      id: uuid(),
      x: SLIDE_WIDTH - 280,
      y: 80,
      width: 240,
      height: 360,
      fill: c.primary,
      shape: 'rounded-rectangle',
      opacity: 0.08,
      border: { width: 0, color: '', style: 'none', radius: 24 },
      zIndex: 1,
    })
  );

  return elements;
}

function buildSectionElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  return [
    defaultShape({
      id: uuid(),
      x: 0,
      y: 0,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fill: c.primary,
      zIndex: 0,
    }),
    defaultText({
      id: uuid(),
      x: 80,
      y: SLIDE_HEIGHT / 2 - 60,
      width: SLIDE_WIDTH - 160,
      height: 120,
      content: d.title ?? 'Título da Seção',
      zIndex: 2,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 44,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: onColor(c.primary, theme),
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: -0.3,
        textTransform: 'none',
      },
    }),
    ...(d.subtitle
      ? [
          defaultText({
            id: uuid(),
            x: 160,
            y: SLIDE_HEIGHT / 2 + 70,
            width: SLIDE_WIDTH - 320,
            height: 50,
            content: d.subtitle,
            zIndex: 2,
            style: {
              fontFamily: theme.fonts.body,
              fontSize: 18,
              fontWeight: 300,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: onColor(c.primary, theme, { muted: true, mutedAlpha: 0.8 }),
              textAlign: 'center',
              lineHeight: 1.4,
              letterSpacing: 0,
              textTransform: 'none',
            },
          }),
        ]
      : []),
  ];
}

// Cabeçalho compartilhado (barra de destaque + título + divisor) usado por content,
// metrics, agenda, chart, table e image-split — todos são variações de "título + corpo".
function buildHeader(title: string | undefined, fallback: string, c: Theme['colors'], theme: Theme): SlideElement[] {
  return [
    defaultShape({
      id: uuid(),
      x: 80,
      y: 56,
      width: 4,
      height: 44,
      fill: c.primary,
      zIndex: 1,
    }),
    defaultText({
      id: uuid(),
      x: 96,
      y: 52,
      width: SLIDE_WIDTH - 176,
      height: 52,
      content: title ?? fallback,
      zIndex: 2,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 30,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: c.text,
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: -0.2,
        textTransform: 'none',
      },
    }),
    defaultShape({
      id: uuid(),
      x: 80,
      y: 114,
      width: SLIDE_WIDTH - 160,
      height: 1,
      fill: c.border,
      zIndex: 1,
    }),
  ];
}

function buildContentElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const elements: SlideElement[] = [...buildHeader(d.title, 'Título do Slide', c, theme)];

  // Bullets
  const bullets = d.bullets ?? (d.content ? [d.content] : []);
  const icons = d.bulletIcons;

  if (bullets.length > 0 && icons && icons.length === bullets.length) {
    // Variante com ícone por bullet: cada item é uma linha ícone + texto.
    const rowH = Math.min(70, (SLIDE_HEIGHT - 160) / bullets.length);
    bullets.forEach((b, i) => {
      const rowY = 144 + i * rowH;
      elements.push(
        defaultIcon({
          id: uuid(),
          x: 80,
          y: rowY,
          width: 36,
          height: 36,
          iconName: icons[i],
          color: c.primary,
          background: c.surface,
          border: { width: 1, color: c.border, style: 'solid', radius: 10 },
          zIndex: 2,
        })
      );
      elements.push(
        defaultText({
          id: uuid(),
          x: 130,
          y: rowY,
          width: SLIDE_WIDTH - 210,
          height: 36,
          content: b,
          zIndex: 2,
          verticalAlign: 'middle',
          style: {
            fontFamily: theme.fonts.body,
            fontSize: 18,
            fontWeight: 400,
            fontStyle: 'normal',
            textDecoration: 'none',
            color: c.textSecondary,
            textAlign: 'left',
            lineHeight: 1.4,
            letterSpacing: 0,
            textTransform: 'none',
          },
        })
      );
    });
  } else if (bullets.length > 0) {
    const bulletText = bullets.map((b) => `• ${b}`).join('\n');
    elements.push(
      defaultText({
        id: uuid(),
        x: 80,
        y: 134,
        width: SLIDE_WIDTH - 160,
        height: SLIDE_HEIGHT - 200,
        content: bulletText,
        zIndex: 2,
        padding: 0,
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 20,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.textSecondary,
          textAlign: 'left',
          lineHeight: 1.8,
          letterSpacing: 0,
          textTransform: 'none',
        },
      })
    );
  }

  return elements;
}

function buildComparisonElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const half = SLIDE_WIDTH / 2;
  const elements: SlideElement[] = [];

  // Title
  if (d.title) {
    elements.push(
      defaultText({
        id: uuid(),
        x: 80,
        y: 36,
        width: SLIDE_WIDTH - 160,
        height: 52,
        content: d.title,
        zIndex: 2,
        style: {
          fontFamily: theme.fonts.heading,
          fontSize: 28,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.text,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: -0.2,
          textTransform: 'none',
        },
      })
    );
  }

  // Left panel
  elements.push(
    defaultShape({
      id: uuid(),
      x: 40,
      y: 104,
      width: half - 60,
      height: SLIDE_HEIGHT - 140,
      fill: c.surface,
      border: { width: 1, color: c.border, style: 'solid', radius: 12 },
      zIndex: 1,
    })
  );
  elements.push(
    defaultShape({
      id: uuid(),
      x: 40,
      y: 104,
      width: half - 60,
      height: 8,
      fill: c.primary,
      border: { width: 0, color: '', style: 'none', radius: 12 },
      zIndex: 2,
    })
  );
  elements.push(
    defaultText({
      id: uuid(),
      x: 56,
      y: 124,
      width: half - 92,
      height: 48,
      content: d.leftTitle ?? 'Opção A',
      zIndex: 3,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 22,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: c.text,
        textAlign: 'left',
        lineHeight: 1.3,
        letterSpacing: 0,
        textTransform: 'none',
      },
    })
  );
  if (d.leftContent) {
    const leftBullets = d.leftContent.split('\n').map((b: string) => `• ${b}`).join('\n');
    elements.push(
      defaultText({
        id: uuid(),
        x: 56,
        y: 180,
        width: half - 92,
        height: SLIDE_HEIGHT - 240,
        content: leftBullets,
        zIndex: 3,
        padding: 0,
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 16,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.textSecondary,
          textAlign: 'left',
          lineHeight: 1.8,
          letterSpacing: 0,
          textTransform: 'none',
        },
      })
    );
  }

  // Right panel
  elements.push(
    defaultShape({
      id: uuid(),
      x: half + 20,
      y: 104,
      width: half - 60,
      height: SLIDE_HEIGHT - 140,
      fill: c.surface,
      border: { width: 1, color: c.border, style: 'solid', radius: 12 },
      zIndex: 1,
    })
  );
  elements.push(
    defaultShape({
      id: uuid(),
      x: half + 20,
      y: 104,
      width: half - 60,
      height: 8,
      fill: c.accent,
      border: { width: 0, color: '', style: 'none', radius: 12 },
      zIndex: 2,
    })
  );
  elements.push(
    defaultText({
      id: uuid(),
      x: half + 36,
      y: 124,
      width: half - 92,
      height: 48,
      content: d.rightTitle ?? 'Opção B',
      zIndex: 3,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 22,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: c.text,
        textAlign: 'left',
        lineHeight: 1.3,
        letterSpacing: 0,
        textTransform: 'none',
      },
    })
  );
  if (d.rightContent) {
    const rightBullets = d.rightContent.split('\n').map((b: string) => `• ${b}`).join('\n');
    elements.push(
      defaultText({
        id: uuid(),
        x: half + 36,
        y: 180,
        width: half - 92,
        height: SLIDE_HEIGHT - 240,
        content: rightBullets,
        zIndex: 3,
        padding: 0,
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 16,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.textSecondary,
          textAlign: 'left',
          lineHeight: 1.8,
          letterSpacing: 0,
          textTransform: 'none',
        },
      })
    );
  }

  return elements;
}

function buildQuoteElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  return [
    defaultShape({
      id: uuid(),
      x: 0,
      y: 0,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fill: c.surface,
      zIndex: 0,
    }),
    defaultShape({
      id: uuid(),
      x: 0,
      y: 0,
      width: 8,
      height: SLIDE_HEIGHT,
      fill: c.primary,
      zIndex: 1,
    }),
    defaultText({
      id: uuid(),
      x: 100,
      y: SLIDE_HEIGHT / 2 - 100,
      width: SLIDE_WIDTH - 200,
      height: 160,
      content: `"${d.quote ?? 'Insira sua citação aqui.'}"`,
      zIndex: 2,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 28,
        fontWeight: 300,
        fontStyle: 'italic',
        textDecoration: 'none',
        color: c.text,
        textAlign: 'center',
        lineHeight: 1.6,
        letterSpacing: 0,
        textTransform: 'none',
      },
    }),
    ...(d.attribution
      ? [
          defaultText({
            id: uuid(),
            x: 100,
            y: SLIDE_HEIGHT / 2 + 80,
            width: SLIDE_WIDTH - 200,
            height: 40,
            content: `— ${d.attribution}`,
            zIndex: 2,
            style: {
              fontFamily: theme.fonts.body,
              fontSize: 16,
              fontWeight: 500,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: c.primary,
              textAlign: 'center',
              lineHeight: 1.4,
              letterSpacing: 0.5,
              textTransform: 'none',
            },
          }),
        ]
      : []),
  ];
}

function buildClosingElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const closingBg = avoidTokenCollision(darkerOf(c.text, c.background), theme);
  return [
    defaultShape({
      id: uuid(),
      x: 0,
      y: 0,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fill: closingBg,
      zIndex: 0,
    }),
    defaultShape({
      id: uuid(),
      x: 0,
      y: 0,
      width: SLIDE_WIDTH,
      height: 6,
      fill: c.primary,
      zIndex: 1,
    }),
    defaultText({
      id: uuid(),
      x: 80,
      y: 160,
      width: SLIDE_WIDTH - 160,
      height: 120,
      content: d.title ?? 'Obrigado',
      zIndex: 2,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 56,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: onColor(closingBg, theme),
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: -0.5,
        textTransform: 'none',
      },
    }),
    ...(d.subtitle
      ? [
          defaultText({
            id: uuid(),
            x: 160,
            y: 295,
            width: SLIDE_WIDTH - 320,
            height: 60,
            content: d.subtitle,
            zIndex: 2,
            style: {
              fontFamily: theme.fonts.body,
              fontSize: 20,
              fontWeight: 300,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: onColor(closingBg, theme, { muted: true, mutedAlpha: 0.6 }),
              textAlign: 'center',
              lineHeight: 1.4,
              letterSpacing: 0,
              textTransform: 'none',
            },
          }),
        ]
      : []),
  ];
}

function buildMetricsElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const elements: SlideElement[] = [...buildHeader(d.title, 'Métricas', c, theme)];

  const metrics = d.metrics?.length ? d.metrics.slice(0, 4) : [{ value: '—', label: 'métrica' }];
  const n = metrics.length;
  const gap = 24;
  const cardW = (SLIDE_WIDTH - 160 - gap * (n - 1)) / n;
  const cardY = 150;
  const cardH = SLIDE_HEIGHT - 210;

  metrics.forEach((m, i) => {
    const x = 80 + i * (cardW + gap);
    elements.push(
      defaultShape({
        id: uuid(),
        x,
        y: cardY,
        width: cardW,
        height: cardH,
        fill: c.surface,
        border: { width: 1, color: c.border, style: 'solid', radius: 14 },
        zIndex: 1,
      })
    );
    elements.push(
      defaultShape({
        id: uuid(),
        x,
        y: cardY,
        width: cardW,
        height: 6,
        fill: c.primary,
        border: { width: 0, color: '', style: 'none', radius: 14 },
        zIndex: 2,
      })
    );
    elements.push(
      defaultText({
        id: uuid(),
        x: x + 16,
        y: cardY + 30,
        width: cardW - 32,
        height: 56,
        content: m.value,
        zIndex: 3,
        style: {
          fontFamily: theme.fonts.heading,
          fontSize: n > 3 ? 32 : 40,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.text,
          textAlign: 'left',
          lineHeight: 1.1,
          letterSpacing: -0.5,
          textTransform: 'none',
        },
      })
    );
    elements.push(
      defaultText({
        id: uuid(),
        x: x + 16,
        y: cardY + 92,
        width: cardW - 32,
        height: 48,
        content: m.label,
        zIndex: 3,
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 14,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.textSecondary,
          textAlign: 'left',
          lineHeight: 1.4,
          letterSpacing: 0,
          textTransform: 'none',
        },
      })
    );
    if (m.delta) {
      elements.push(
        defaultText({
          id: uuid(),
          x: x + 16,
          y: cardY + cardH - 40,
          width: cardW - 32,
          height: 28,
          content: m.delta,
          zIndex: 3,
          style: {
            fontFamily: theme.fonts.body,
            fontSize: 13,
            fontWeight: 600,
            fontStyle: 'normal',
            textDecoration: 'none',
            color: c.accent,
            textAlign: 'left',
            lineHeight: 1.3,
            letterSpacing: 0,
            textTransform: 'none',
          },
        })
      );
    }
  });

  return elements;
}

function buildAgendaElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const elements: SlideElement[] = [...buildHeader(d.title, 'Agenda', c, theme)];

  const items = (d.bullets ?? []).slice(0, 6);
  if (items.length === 0) return elements;

  const startY = 148;
  const rowH = Math.min(64, (SLIDE_HEIGHT - startY - 40) / items.length);
  const badgeSize = 32;

  // Linha conectora vertical atrás dos badges numerados
  elements.push(
    defaultShape({
      id: uuid(),
      x: 80 + badgeSize / 2 - 1,
      y: startY + badgeSize / 2,
      width: 2,
      height: (items.length - 1) * rowH,
      fill: c.border,
      zIndex: 1,
    })
  );

  items.forEach((item, i) => {
    const rowY = startY + i * rowH;
    elements.push(
      defaultShape({
        id: uuid(),
        x: 80,
        y: rowY,
        width: badgeSize,
        height: badgeSize,
        fill: c.primary,
        shape: 'circle',
        zIndex: 2,
      })
    );
    elements.push(
      defaultText({
        id: uuid(),
        x: 80,
        y: rowY,
        width: badgeSize,
        height: badgeSize,
        content: String(i + 1),
        zIndex: 3,
        verticalAlign: 'middle',
        style: {
          fontFamily: theme.fonts.heading,
          fontSize: 15,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: onColor(c.primary, theme),
          textAlign: 'center',
          lineHeight: 1,
          letterSpacing: 0,
          textTransform: 'none',
        },
      })
    );
    elements.push(
      defaultText({
        id: uuid(),
        x: 80 + badgeSize + 20,
        y: rowY,
        width: SLIDE_WIDTH - 160 - badgeSize - 20,
        height: badgeSize,
        content: item,
        zIndex: 2,
        verticalAlign: 'middle',
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 19,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.text,
          textAlign: 'left',
          lineHeight: 1.3,
          letterSpacing: 0,
          textTransform: 'none',
        },
      })
    );
  });

  return elements;
}

function buildChartElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const elements: SlideElement[] = [...buildHeader(d.title, 'Gráfico', c, theme)];

  const chart = d.chart ?? { chartType: 'bar' as const, labels: ['A', 'B', 'C'], series: [{ name: 'Série 1', values: [1, 2, 3] }] };
  elements.push(
    defaultChart({
      id: uuid(),
      x: 120,
      y: 148,
      width: SLIDE_WIDTH - 240,
      height: SLIDE_HEIGHT - 200,
      chartType: chart.chartType,
      labels: chart.labels,
      series: chart.series,
      colors: [c.primary, c.accent, c.secondary, theme.colors.textSecondary],
      showLegend: chart.series.length > 1 || chart.chartType === 'pie',
      title: chart.title,
      zIndex: 2,
    })
  );

  return elements;
}

function buildTableElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const elements: SlideElement[] = [...buildHeader(d.title, 'Tabela', c, theme)];

  const columns = d.columns?.length ? d.columns : [{ heading: 'Coluna', rows: ['—'] }];
  const rowCount = Math.max(...columns.map((col) => col.rows.length), 0);

  // style.color é setado explicitamente (em vez de deixar o fallback hardcoded do TableEl,
  // que não acompanha troca de tema) para que setTheme consiga remapear a cor do corpo da tabela.
  const headerRow: TableCell[] = columns.map((col) => ({ content: col.heading, style: {}, background: 'transparent' }));
  const bodyRows: TableCell[][] = Array.from({ length: rowCount }, (_, r) =>
    columns.map((col): TableCell => ({ content: col.rows[r] ?? '', style: { color: c.text }, background: 'transparent' }))
  );

  elements.push(
    defaultTable({
      id: uuid(),
      x: 80,
      y: 148,
      width: SLIDE_WIDTH - 160,
      height: SLIDE_HEIGHT - 200,
      rows: [headerRow, ...bodyRows],
      headerRow: true,
      headerCol: false,
      borderColor: c.border,
      headerBackground: c.primary,
      headerTextColor: onColor(c.primary, theme),
      alternateRowColor: true,
      alternateColor: c.surface,
      zIndex: 2,
    })
  );

  return elements;
}

function buildImageSplitElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const elements: SlideElement[] = [];
  const half = SLIDE_WIDTH / 2;

  // Metade da imagem (ou placeholder, quando não há src — a IA não inventa imagens)
  if (d.image?.src) {
    elements.push(
      defaultImage({
        id: uuid(),
        x: half,
        y: 0,
        width: half,
        height: SLIDE_HEIGHT,
        src: d.image.src,
        alt: d.image.alt ?? '',
        objectFit: 'cover',
        zIndex: 1,
      })
    );
  } else {
    elements.push(
      defaultShape({
        id: uuid(),
        x: half,
        y: 0,
        width: half,
        height: SLIDE_HEIGHT,
        fill: c.surface,
        zIndex: 0,
      })
    );
    elements.push(
      defaultIcon({
        id: uuid(),
        x: half + half / 2 - 32,
        y: SLIDE_HEIGHT / 2 - 32,
        width: 64,
        height: 64,
        iconName: 'Image',
        color: c.border,
        background: 'transparent',
        zIndex: 1,
      })
    );
  }

  // Metade de texto
  elements.push(
    defaultShape({
      id: uuid(),
      x: 64,
      y: 56,
      width: 4,
      height: 44,
      fill: c.primary,
      zIndex: 1,
    })
  );
  elements.push(
    defaultText({
      id: uuid(),
      x: 80,
      y: 52,
      width: half - 140,
      height: 90,
      content: d.title ?? 'Título',
      zIndex: 2,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 26,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: c.text,
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: -0.2,
        textTransform: 'none',
      },
    })
  );

  const bullets = d.bullets ?? (d.content ? [d.content] : []);
  if (bullets.length > 0) {
    elements.push(
      defaultText({
        id: uuid(),
        x: 80,
        y: 160,
        width: half - 140,
        height: SLIDE_HEIGHT - 220,
        content: bullets.map((b) => `• ${b}`).join('\n'),
        zIndex: 2,
        padding: 0,
        style: {
          fontFamily: theme.fonts.body,
          fontSize: 16,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: c.textSecondary,
          textAlign: 'left',
          lineHeight: 1.7,
          letterSpacing: 0,
          textTransform: 'none',
        },
      })
    );
  }

  return elements;
}

export function createBlankSlide(): Slide {
  return {
    id: uuid(),
    layout: 'blank',
    background: { type: 'color', color: '#ffffff' },
    elements: [],
  };
}

export function createSlideFromLayout(layout: LayoutType, theme: Theme): Slide {
  const defaultData: Record<LayoutType, AISlideSpec['data']> = {
    blank: {},
    cover: { title: 'Título da Apresentação', subtitle: 'Seu subtítulo aqui', author: 'Nome do Autor' },
    section: { title: 'Título da Seção', subtitle: 'Subtítulo da seção' },
    content: { title: 'Título do Slide', bullets: ['Primeiro ponto', 'Segundo ponto', 'Terceiro ponto'] },
    comparison: {
      title: 'Comparação',
      leftTitle: 'Opção A',
      leftContent: 'Primeiro ponto\nSegundo ponto\nTerceiro ponto',
      rightTitle: 'Opção B',
      rightContent: 'Primeiro ponto\nSegundo ponto\nTerceiro ponto',
    },
    quote: { quote: 'A única forma de fazer um ótimo trabalho é amar o que você faz.', attribution: 'Steve Jobs' },
    closing: { title: 'Obrigado', subtitle: 'Perguntas?' },
    metrics: {
      title: 'Métricas',
      metrics: [
        { value: '42%', label: 'crescimento', delta: '+8pp' },
        { value: '128', label: 'novos clientes' },
        { value: 'R$ 1,2M', label: 'receita' },
      ],
    },
    agenda: { title: 'Agenda', bullets: ['Primeiro tópico', 'Segundo tópico', 'Terceiro tópico'] },
    chart: {
      title: 'Gráfico',
      chart: { chartType: 'bar', labels: ['Jan', 'Fev', 'Mar', 'Abr'], series: [{ name: 'Série 1', values: [40, 65, 50, 80] }] },
    },
    table: {
      title: 'Tabela',
      columns: [
        { heading: 'Item', rows: ['Linha 1', 'Linha 2', 'Linha 3'] },
        { heading: 'Valor', rows: ['—', '—', '—'] },
      ],
    },
    'image-split': { title: 'Título', bullets: ['Primeiro ponto', 'Segundo ponto', 'Terceiro ponto'], image: {} },
  };

  return buildSlideFromSpec({ layout, data: defaultData[layout] }, theme);
}
