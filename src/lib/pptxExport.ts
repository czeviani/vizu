import PptxGenJS from 'pptxgenjs';
import type {
  Presentation,
  Slide,
  SlideElement,
  TextElement,
  ImageElement,
  ShapeElement,
  LineElement,
} from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';

// Convert pixel position to inches (pptx uses inches, slide is 10x5.63 in at 96 dpi)
const PX_TO_IN = 10 / SLIDE_WIDTH;

function px(v: number) {
  return parseFloat((v * PX_TO_IN).toFixed(4));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

function colorToHex(color: string): string {
  if (color.startsWith('#')) return color.replace('#', '');
  // Basic named colors
  const map: Record<string, string> = {
    white: 'FFFFFF',
    black: '000000',
    transparent: 'FFFFFF',
  };
  return map[color] ?? '000000';
}

function addTextElement(pptxSlide: PptxGenJS.Slide, el: TextElement) {
  const lines = el.content.split('\n');
  const textItems: PptxGenJS.TextProps[] = lines.map((line) => ({
    text: line,
    options: {
      fontSize: el.style.fontSize * 0.75, // pt conversion
      bold: el.style.fontWeight >= 700,
      italic: el.style.fontStyle === 'italic',
      underline: el.style.textDecoration === 'underline' ? { style: 'sng' } : undefined,
      color: colorToHex(el.style.color),
      fontFace: el.style.fontFamily,
      align: el.style.textAlign as 'left' | 'center' | 'right',
      breakLine: true,
    },
  }));

  pptxSlide.addText(textItems, {
    x: px(el.x),
    y: px(el.y),
    w: px(el.width),
    h: px(el.height),
    margin: px(el.padding),
    valign: el.verticalAlign,
    rotate: el.rotation,
    transparency: Math.round((1 - el.opacity) * 100),
  });
}

function addShapeElement(pptxSlide: PptxGenJS.Slide, el: ShapeElement) {
  const shapeMap: Record<string, string> = {
    rectangle: 'rect',
    'rounded-rectangle': 'roundRect',
    circle: 'ellipse',
    triangle: 'triangle',
    diamond: 'diamond',
    pentagon: 'pentagon',
    hexagon: 'hexagon',
    star: 'star5',
    'arrow-right': 'rightArrow',
    'arrow-left': 'leftArrow',
  };

  const shapeName = (shapeMap[el.shape] ?? 'rect') as PptxGenJS.ShapeType;

  const opts: PptxGenJS.ShapeProps = {
    x: px(el.x),
    y: px(el.y),
    w: px(el.width),
    h: px(el.height),
    rotate: el.rotation,
  };

  if (el.fill && el.fill !== 'transparent') {
    opts.fill = { color: colorToHex(el.fill) };
  }

  if (el.border.width > 0 && el.border.style !== 'none') {
    opts.line = {
      color: colorToHex(el.border.color),
      width: el.border.width,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dashType: (el.border.style === 'dashed' ? 'dash' : el.border.style === 'dotted' ? 'dot' : 'solid') as any,
    };
  }

  pptxSlide.addShape(shapeName, opts);
}

function addImageElement(pptxSlide: PptxGenJS.Slide, el: ImageElement) {
  if (!el.src) return;
  pptxSlide.addImage({
    path: el.src,
    x: px(el.x),
    y: px(el.y),
    w: px(el.width),
    h: px(el.height),
    rotate: el.rotation,
    transparency: Math.round((1 - el.opacity) * 100),
  });
}

function addLineElement(pptxSlide: PptxGenJS.Slide, el: LineElement) {
  pptxSlide.addShape('line' as PptxGenJS.ShapeType, {
    x: px(el.x),
    y: px(el.y),
    w: px(el.width),
    h: px(el.height),
    line: {
      color: colorToHex(el.color),
      width: el.thickness,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dashType: (el.style === 'dashed' ? 'dash' : el.style === 'dotted' ? 'dot' : 'solid') as any,
    },
  });
}

function processSlide(pptx: PptxGenJS, slide: Slide) {
  const pptxSlide = pptx.addSlide();

  // Background
  if (slide.background.type === 'color' && slide.background.color) {
    pptxSlide.background = { color: colorToHex(slide.background.color) };
  } else if (slide.background.type === 'gradient' && slide.background.gradient) {
    pptxSlide.background = { color: colorToHex(slide.background.gradient.from) };
  } else if (slide.background.type === 'image' && slide.background.image) {
    pptxSlide.background = { path: slide.background.image };
  }

  // Sort elements by zIndex
  const sorted = [...slide.elements].filter((e) => e.visible).sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sorted) {
    try {
      switch (el.type) {
        case 'text':
          addTextElement(pptxSlide, el as TextElement);
          break;
        case 'shape':
          addShapeElement(pptxSlide, el as ShapeElement);
          break;
        case 'image':
          addImageElement(pptxSlide, el as ImageElement);
          break;
        case 'line':
          addLineElement(pptxSlide, el as LineElement);
          break;
      }
    } catch (e) {
      console.warn(`Failed to export element ${el.id}:`, e);
    }
  }
}

export async function exportToPptx(presentation: Presentation): Promise<Blob> {
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_16x9'; // 10 x 5.63 in — matches PX_TO_IN = 10/960
  pptx.title = presentation.title;
  pptx.subject = presentation.metadata.description ?? '';
  pptx.author = presentation.metadata.author ?? 'Vizu';

  for (const slide of presentation.slides) {
    processSlide(pptx, slide);
  }

  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}
