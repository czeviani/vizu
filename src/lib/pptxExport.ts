import PptxGenJS from 'pptxgenjs';
import type {
  Presentation, Slide,
  TextElement, ImageElement, ShapeElement, LineElement, IconElement, TableElement,
} from '@/types/slide';
import { SLIDE_WIDTH } from '@/types/slide';
import { iconToDataUrl } from './iconPaths';
import { toPptxFontFace } from './fontMap';

// pixel → inches: slide é LAYOUT 'VIZU' = 10×5.625 in; 960px de largura → 10in (§4.1)
const PX_TO_IN = 10 / SLIDE_WIDTH;
// pixel → pt: 1px = 0.75pt (96dpi → 72pt/in), usado em fontSize, margin/inset e charSpacing
const PX_TO_PT = 0.75;

function px(v: number) {
  return parseFloat((v * PX_TO_IN).toFixed(4));
}

function pt(v: number) {
  return parseFloat((v * PX_TO_PT).toFixed(2));
}

function colorToHex(color: string | undefined): string {
  if (!color) return '000000';
  if (color.startsWith('#')) return color.replace('#', '').slice(0, 6);

  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return [r, g, b].map((c) => Number(c).toString(16).padStart(2, '0')).join('');
  }

  const map: Record<string, string> = {
    white: 'FFFFFF', black: '000000', transparent: 'FFFFFF',
    red: 'FF0000', blue: '0000FF', green: '008000',
  };
  return map[color.toLowerCase()] ?? '000000';
}

function colorAlpha(color: string | undefined): number {
  const m = color?.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/i);
  return m ? parseFloat(m[1]) : 1;
}

function applyTextTransform(text: string, transform: string): string {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') return text.replace(/\b\w/g, (c) => c.toUpperCase());
  return text;
}

function toShadowProps(shadow: { enabled: boolean; x: number; y: number; blur: number; color: string }): PptxGenJS.ShadowProps | undefined {
  if (!shadow.enabled) return undefined;
  const offset = Math.hypot(shadow.x, shadow.y);
  const angle = ((Math.atan2(shadow.y, shadow.x) * 180) / Math.PI + 360) % 360;
  return {
    type: 'outer',
    color: colorToHex(shadow.color),
    opacity: colorAlpha(shadow.color),
    blur: pt(shadow.blur),
    offset: offset ? pt(offset) : 0.5,
    angle: Math.round(angle),
  };
}

function addTextElement(pptxSlide: PptxGenJS.Slide, el: TextElement) {
  const lines = el.content.split('\n');
  const textItems: PptxGenJS.TextProps[] = lines.map((line) => {
    // Bullets nativos: linhas que já usam o prefixo "• " (composers determinísticos)
    // viram bullet real do PowerPoint em vez do caractere literal.
    const isBullet = line.startsWith('• ');
    const raw = isBullet ? line.slice(2) : line;
    const text = applyTextTransform(raw, el.style.textTransform);

    return {
      text,
      options: {
        fontSize: pt(el.style.fontSize),
        bold: el.style.fontWeight >= 700,
        italic: el.style.fontStyle === 'italic',
        underline: el.style.textDecoration === 'underline' ? { style: 'sng' } : undefined,
        strike: el.style.textDecoration === 'line-through',
        color: colorToHex(el.style.color),
        fontFace: toPptxFontFace(el.style.fontFamily),
        align: el.style.textAlign as 'left' | 'center' | 'right',
        charSpacing: el.style.letterSpacing ? pt(el.style.letterSpacing) : undefined,
        lineSpacingMultiple: el.style.lineHeight || undefined,
        bullet: isBullet ? true : undefined,
        breakLine: true,
      },
    };
  });

  pptxSlide.addText(textItems, {
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
    margin: pt(el.padding),
    valign: el.verticalAlign,
    rotate: el.rotation,
    transparency: Math.round((1 - el.opacity) * 100),
    isTextBox: true,
    fill: el.background && el.background !== 'transparent' ? { color: colorToHex(el.background) } : undefined,
    line: el.border.width > 0 && el.border.style !== 'none'
      ? {
        color: colorToHex(el.border.color),
        width: pt(el.border.width),
        dashType: el.border.style === 'dashed' ? 'dash' : el.border.style === 'dotted' ? 'sysDot' : 'solid',
      }
      : undefined,
  });
}

const SHAPE_MAP: Record<string, string> = {
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

function addShapeElement(pptxSlide: PptxGenJS.Slide, el: ShapeElement) {
  const shapeName = (SHAPE_MAP[el.shape] ?? 'rect') as PptxGenJS.ShapeType;
  // ShapeProps não tem opacidade de objeto único — transparency vai em fill/line (§4.3).
  const alpha = Math.round((1 - el.opacity) * 100) || undefined;
  const opts: PptxGenJS.ShapeProps = {
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
    rotate: el.rotation,
    shadow: toShadowProps(el.shadow),
  };

  if (el.fill && el.fill !== 'transparent') {
    opts.fill = { color: colorToHex(el.fill), transparency: alpha };
  }
  if (el.border.width > 0 && el.border.style !== 'none') {
    opts.line = {
      color: colorToHex(el.border.color),
      width: el.border.width,
      dashType: el.border.style === 'dashed' ? 'dash' : el.border.style === 'dotted' ? 'sysDot' : 'solid',
      transparency: alpha,
    };
  }

  pptxSlide.addShape(shapeName, opts);
}

function addBorderOverlay(pptxSlide: PptxGenJS.Slide, el: { x: number; y: number; width: number; height: number; rotation: number; border: { width: number; color: string; style: string } }) {
  // ImageProps não suporta borda nativa no pptxgenjs — desenha um retângulo sem
  // preenchimento por cima, na mesma posição, como um segundo objeto editável.
  if (el.border.width <= 0 || el.border.style === 'none') return;
  pptxSlide.addShape('rect' as PptxGenJS.ShapeType, {
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
    rotate: el.rotation,
    line: {
      color: colorToHex(el.border.color),
      width: el.border.width,
      dashType: el.border.style === 'dashed' ? 'dash' : el.border.style === 'dotted' ? 'sysDot' : 'solid',
    },
  });
}

function addImageElement(pptxSlide: PptxGenJS.Slide, el: ImageElement) {
  if (!el.src) return;

  const base: PptxGenJS.ImageProps = {
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
    rotate: el.rotation,
    transparency: Math.round((1 - el.opacity) * 100),
    shadow: toShadowProps(el.shadow),
  };

  if (el.src.startsWith('data:')) {
    pptxSlide.addImage({ ...base, data: el.src });
  } else {
    pptxSlide.addImage({ ...base, path: el.src });
  }

  addBorderOverlay(pptxSlide, el);
}

async function addIconElement(pptxSlide: PptxGenJS.Slide, el: IconElement) {
  // Ícones (Lucide/SVG) não têm equivalente nativo editável no PPTX — rasterizados em
  // PNG e inseridos como imagem, mantendo posição/tamanho fiéis (limitação aceita, §4.5).
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
      dashType: el.style === 'dashed' ? 'dash' : el.style === 'dotted' ? 'sysDot' : 'solid',
      beginArrowType: el.arrowStart ? 'triangle' : 'none',
      endArrowType: el.arrowEnd ? 'triangle' : 'none',
      transparency: Math.round((1 - el.opacity) * 100) || undefined,
    },
  });
}

function addTableElement(pptxSlide: PptxGenJS.Slide, el: TableElement) {
  const rows: PptxGenJS.TableRow[] = el.rows.map((row, rIdx) => {
    const isHeaderRow = el.headerRow && rIdx === 0;
    return row.map((cell, cIdx): PptxGenJS.TableCell => {
      const isHeaderCol = el.headerCol && cIdx === 0;
      const isHeader = isHeaderRow || isHeaderCol;
      const altBg = el.alternateRowColor && !isHeader && rIdx % 2 === 1 ? el.alternateColor : undefined;
      const bg = (cell.background && cell.background !== 'transparent')
        ? cell.background
        : isHeader ? el.headerBackground : altBg;

      return {
        text: cell.content,
        options: {
          bold: isHeader || (cell.style.fontWeight ?? 0) >= 700,
          italic: cell.style.fontStyle === 'italic',
          color: colorToHex(isHeader ? el.headerTextColor : cell.style.color),
          fontSize: pt(cell.style.fontSize ?? 14),
          fontFace: toPptxFontFace(cell.style.fontFamily ?? 'Inter'),
          align: (cell.style.textAlign as 'left' | 'center' | 'right') ?? 'left',
          fill: bg ? { color: colorToHex(bg) } : undefined,
          colspan: cell.colspan,
          rowspan: cell.rowspan,
          border: { color: colorToHex(el.borderColor), pt: 1 },
        },
      };
    });
  });

  // TableProps não suporta transparency de objeto — opacidade já refletida por célula via fill.
  pptxSlide.addTable(rows, {
    x: px(el.x), y: px(el.y), w: px(el.width), h: px(el.height),
    border: { color: colorToHex(el.borderColor), pt: 1 },
  });
}

async function processSlide(pptx: PptxGenJS, slide: Slide) {
  const pptxSlide = pptx.addSlide();

  // Background
  if (slide.background.type === 'color' && slide.background.color) {
    pptxSlide.background = { color: colorToHex(slide.background.color) };
  } else if (slide.background.type === 'gradient' && slide.background.gradient) {
    // Gradiente de fundo não é suportado nativamente pelo pptxgenjs; usa a cor "from" como fallback (§4.6).
    pptxSlide.background = { color: colorToHex(slide.background.gradient.from) };
  } else if (slide.background.type === 'image' && slide.background.image) {
    if (slide.background.image.startsWith('data:')) {
      pptxSlide.background = { data: slide.background.image };
    } else {
      pptxSlide.background = { path: slide.background.image };
    }
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
        case 'table':
          addTableElement(pptxSlide, el as TableElement);
          break;
      }
    } catch (e) {
      console.warn(`Failed to export element ${el.id}:`, e);
    }
  }

  if (slide.notes) {
    pptxSlide.addNotes(slide.notes);
  }
}

export async function exportToPptx(presentation: Presentation): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'VIZU', width: 10, height: 5.625 });
  pptx.layout = 'VIZU';
  pptx.title = presentation.title;
  pptx.subject = presentation.metadata.description ?? '';
  pptx.author = presentation.metadata.author ?? 'Vizu';

  for (const slide of presentation.slides) {
    await processSlide(pptx, slide);
  }

  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}
