import { v4 as uuid } from 'uuid';
import type {
  Slide,
  SlideElement,
  TextElement,
  ShapeElement,
  Theme,
  AISlideSpec,
  LayoutType,
} from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';

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
      content: d.title ?? 'Presentation Title',
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
      content: d.title ?? 'Section Title',
      zIndex: 2,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 44,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#ffffff',
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
              color: 'rgba(255,255,255,0.8)',
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

function buildContentElements(d: AISlideSpec['data'], c: Theme['colors'], theme: Theme): SlideElement[] {
  const elements: SlideElement[] = [];

  // Title bar
  elements.push(
    defaultShape({
      id: uuid(),
      x: 80,
      y: 56,
      width: 4,
      height: 44,
      fill: c.primary,
      zIndex: 1,
    })
  );

  // Title
  elements.push(
    defaultText({
      id: uuid(),
      x: 96,
      y: 52,
      width: SLIDE_WIDTH - 176,
      height: 52,
      content: d.title ?? 'Slide Title',
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
    })
  );

  // Divider
  elements.push(
    defaultShape({
      id: uuid(),
      x: 80,
      y: 114,
      width: SLIDE_WIDTH - 160,
      height: 1,
      fill: c.border,
      zIndex: 1,
    })
  );

  // Bullets
  const bullets = d.bullets ?? (d.content ? [d.content] : []);
  if (bullets.length > 0) {
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
      content: d.leftTitle ?? 'Option A',
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
      content: d.rightTitle ?? 'Option B',
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
      content: `"${d.quote ?? 'Insert your quote here.'}"`,
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
  return [
    defaultShape({
      id: uuid(),
      x: 0,
      y: 0,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fill: c.text,
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
      content: d.title ?? 'Thank You',
      zIndex: 2,
      style: {
        fontFamily: theme.fonts.heading,
        fontSize: 56,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#ffffff',
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
              color: 'rgba(255,255,255,0.6)',
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
    cover: { title: 'Presentation Title', subtitle: 'Your subtitle here', author: 'Author Name' },
    section: { title: 'Section Title', subtitle: 'Section subtitle' },
    content: { title: 'Slide Title', bullets: ['First point', 'Second point', 'Third point'] },
    comparison: {
      title: 'Comparison',
      leftTitle: 'Option A',
      leftContent: 'First point\nSecond point\nThird point',
      rightTitle: 'Option B',
      rightContent: 'First point\nSecond point\nThird point',
    },
    quote: { quote: 'The only way to do great work is to love what you do.', attribution: 'Steve Jobs' },
    closing: { title: 'Thank You', subtitle: 'Questions?' },
  };

  return buildSlideFromSpec({ layout, data: defaultData[layout] }, theme);
}
