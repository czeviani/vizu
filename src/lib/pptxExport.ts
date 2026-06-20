import PptxGenJS from 'pptxgenjs';
import type {
  Presentation, Slide, SlideElement,
  TextElement, ImageElement, ShapeElement, LineElement, IconElement,
} from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';
import { iconToDataUrl } from './iconPaths';

// pixel → inches: slide is LAYOUT_16x9 = 10×5.625 inches; 960px wide → 10in
const PX_TO_IN = 10 / SLIDE_WIDTH;

function px(v: number) {
  return parseFloat((v * PX_TO_IN).toFixed(4));
}

function colorToHex(color: string): string {
  if (!color) return '000000';
  if (color.startsWith('#')) return color.replace('#', '');
  const map: Record<string, string> = {
    white: 'FFFFFF', black: '000000', transparent: 'FFFFFF',
    red: 'FF0000', blue: '0000FF', green: '008000',
  };
  return map[color.toLowerCase()] ?? '000000';
}

function addTextElement(pptxSlide: PptxGenJS.Slide, el: TextElement) {
  const lines = el.content.split('\n');
  const textItems: PptxGenJS.TextProps[] = lines.map((line) => ({
    text: line,
    options: {
      fontSize: el.style.fontSize * 0.75,
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
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
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
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
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

  if (el.src.startsWith('data:')) {
    // Embedded base64 data URL — pass directly
    const match = el.src.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      const ext = match[1].split('/')[1].toLowerCase().replace('jpeg', 'jpg') as 'jpg' | 'png' | 'gif' | 'webp';
      pptxSlide.addImage({
        data: el.src,
        x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
        rotate: el.rotation,
        transparency: Math.round((1 - el.opacity) * 100),
      });
      return;
    }
  }

  pptxSlide.addImage({
    path: el.src,
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
    rotate: el.rotation,
    transparency: Math.round((1 - el.opacity) * 100),
  });
}

async function addIconElement(pptxSlide: PptxGenJS.Slide, el: IconElement) {
  // Convert SVG icon to PNG data URL for PowerPoint compatibility.
  // PptxGenJS does not support SVG natively in all PowerPoint versions.
  const dataUrl = await iconToDataUrl(el.iconName, el.color, 200);
  if (!dataUrl) return;

  pptxSlide.addImage({
    data: dataUrl,
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
    rotate: el.rotation,
    transparency: Math.round((1 - el.opacity) * 100),
  });
}

function addLineElement(pptxSlide: PptxGenJS.Slide, el: LineElement) {
  pptxSlide.addShape('line' as PptxGenJS.ShapeType, {
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
    line: {
      color: colorToHex(el.color),
      width: el.thickness,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dashType: (el.style === 'dashed' ? 'dash' : el.style === 'dotted' ? 'dot' : 'solid') as any,
    },
  });
}

async function processSlide(pptx: PptxGenJS, slide: Slide) {
  const pptxSlide = pptx.addSlide();

  // Background
  if (slide.background.type === 'color' && slide.background.color) {
    pptxSlide.background = { color: colorToHex(slide.background.color) };
  } else if (slide.background.type === 'gradient' && slide.background.gradient) {
    // PPTX gradient support is limited; use "from" color as fallback
    pptxSlide.background = { color: colorToHex(slide.background.gradient.from) };
  } else if (slide.background.type === 'image' && slide.background.image) {
    pptxSlide.background = { path: slide.background.image };
  }

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
        case 'icon':
          await addIconElement(pptxSlide, el as IconElement);
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
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = presentation.title;
  pptx.subject = presentation.metadata.description ?? '';
  pptx.author = presentation.metadata.author ?? 'Vizu';

  for (const slide of presentation.slides) {
    await processSlide(pptx, slide);
  }

  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}
