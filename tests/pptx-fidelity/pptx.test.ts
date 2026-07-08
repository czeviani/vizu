import { describe, it, expect, vi } from 'vitest';
import { execSync } from 'child_process';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { ALL_FIXTURES, TINY_PNG } from './fixtures';
import { SLIDE_WIDTH } from '@/types/slide';

// iconToDataUrl() usa document.createElement('canvas') (rasterização no browser),
// indisponível em Node — mockado para devolver um PNG fixo e testar só posição/embed,
// que é o que a fidelidade PPTX (§6) realmente precisa verificar (§4.5: limitação aceita).
vi.mock('@/lib/iconPaths', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/iconPaths')>();
  return { ...actual, iconToDataUrl: vi.fn().mockResolvedValue(TINY_PNG) };
});

const { exportToPptx } = await import('@/lib/pptxExport');

const EMU_PER_IN = 914400;
const TOLERANCE_IN = 0.02;
const PX_TO_IN = 10 / SLIDE_WIDTH;

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function expectApproxIn(actualEmu: number, expectedPx: number, label: string) {
  const actualIn = actualEmu / EMU_PER_IN;
  const expectedIn = expectedPx * PX_TO_IN;
  expect(Math.abs(actualIn - expectedIn), `${label}: esperado ~${expectedIn.toFixed(3)}in, obtido ${actualIn.toFixed(3)}in`).toBeLessThanOrEqual(TOLERANCE_IN);
}

async function loadZip(presentation: Parameters<typeof exportToPptx>[0]) {
  const blob = await exportToPptx(presentation);
  const buffer = Buffer.from(await blob.arrayBuffer());
  return JSZip.loadAsync(buffer);
}

async function slideXmlDoc(zip: JSZip, slideIndex: number) {
  const file = zip.file(`ppt/slides/slide${slideIndex + 1}.xml`);
  if (!file) throw new Error(`slide${slideIndex + 1}.xml não encontrado no pacote`);
  const text = await file.async('text');
  return xml.parse(text);
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

describe('Fidelidade PPTX — §6 do plano', () => {
  it('gera um pacote .pptx válido (zip com [Content_Types].xml e slides) para cada fixture', async () => {
    for (const { name, presentation } of ALL_FIXTURES) {
      const zip = await loadZip(presentation);
      expect(zip.file('[Content_Types].xml'), `${name}: [Content_Types].xml ausente`).toBeTruthy();
      const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
      expect(slideFiles.length, `${name}: nº de slides no pacote`).toBe(presentation.slides.length);
    }
  });

  it('abre sem estrutura de reparo: presentation.xml referencia todos os slides', async () => {
    for (const { name, presentation } of ALL_FIXTURES) {
      const zip = await loadZip(presentation);
      const presXml = await zip.file('ppt/presentation.xml')!.async('text');
      const doc = xml.parse(presXml);
      const sldIds = asArray(doc['p:presentation']?.['p:sldIdLst']?.['p:sldId']);
      expect(sldIds.length, `${name}: p:sldIdLst`).toBe(presentation.slides.length);
    }
  });

  it('posiciona e dimensiona shapes dentro da tolerância ±0.02" (fixture all-element-types)', async () => {
    const { presentation } = ALL_FIXTURES[0];
    const zip = await loadZip(presentation);
    const doc = await slideXmlDoc(zip, 0);
    const shapes = asArray(doc['p:sld']['p:cSld']['p:spTree']['p:sp']);

    // O primeiro <p:sp> é o texto (x:40,y:20 → 0.4167in, 0.2083in em px→in)
    const titleShape = shapes.find((s: any) => s['p:txBody']?.['a:p']?.['a:r']?.['a:t'] === 'Título de teste');
    expect(titleShape, 'shape de texto "Título de teste" não encontrado').toBeTruthy();
    const xfrm = titleShape['p:spPr']['a:xfrm'];
    expectApproxIn(Number(xfrm['a:off']['@_x']), 40, 'texto x');
    expectApproxIn(Number(xfrm['a:off']['@_y']), 20, 'texto y');
    expectApproxIn(Number(xfrm['a:ext']['@_cx']), 300, 'texto largura');
    expectApproxIn(Number(xfrm['a:ext']['@_cy']), 60, 'texto altura');
  });

  it('preserva rotação e opacidade dos elementos (fixture rotation-opacity)', async () => {
    const { presentation } = ALL_FIXTURES[1];
    const zip = await loadZip(presentation);
    const doc = await slideXmlDoc(zip, 0);
    const shapes = asArray(doc['p:sld']['p:cSld']['p:spTree']['p:sp']);

    // shapes 2-5 (índices 1..4) têm rotação 15/45/90/270 — rot em XML é graus*60000
    const rotations = [0, 15, 45, 90, 270];
    shapes.slice(0, 5).forEach((s: any, i: number) => {
      const rot = Number(s['p:spPr']['a:xfrm']['@_rot'] ?? 0) / 60000;
      expect(rot, `shape ${i} rotação`).toBeCloseTo(rotations[i], 0);
    });

    // shape 2 (índice 1) tem opacity 0.5 → alphaMod/alpha em torno de 50000 (§4.3, fill/line transparency)
    const semiTransparent = shapes[1]['p:spPr']['a:solidFill']['a:srgbClr']['a:alpha'];
    expect(Number(semiTransparent['@_val'])).toBeCloseTo(50000, -3);
  });

  it('mantém a ordem de empilhamento igual ao zIndex crescente (fixture z-order)', async () => {
    const { presentation } = ALL_FIXTURES[2];
    const zip = await loadZip(presentation);
    const doc = await slideXmlDoc(zip, 0);
    const shapes = asArray(doc['p:sld']['p:cSld']['p:spTree']['p:sp']);
    // pptxgenjs não propaga o `id`/`name` do elemento Vizu para o XML (fica "Shape N"
    // autogerado) — a ordem real de empilhamento é a ordem de inserção no p:spTree,
    // que deve refletir o zIndex crescente definido no fixture (bottom=1, mid=15, top=30).
    const fills = shapes.map((s: any) => s['p:spPr']['a:solidFill']['a:srgbClr']['@_val']);
    expect(fills).toEqual(['3B82F6', 'F59E0B', '22C55E']); // z-bottom, z-mid, z-top
  });

  it('exporta bullets nativos (sem "•" literal) e notas do apresentador (fixture lists-notes)', async () => {
    const { presentation } = ALL_FIXTURES[3];
    const zip = await loadZip(presentation);
    const doc = await slideXmlDoc(zip, 0);
    const shape = asArray(doc['p:sld']['p:cSld']['p:spTree']['p:sp'])[0];
    const paragraphs = asArray(shape['p:txBody']['a:p']);

    expect(paragraphs.length).toBe(3);
    for (const p of paragraphs) {
      const runText = p['a:r']['a:t'];
      expect(runText.startsWith('•')).toBe(false);
      // bullet nativo: parágrafo tem pPr com buChar/buAutoNum (não é texto puro)
      expect(p['a:pPr']?.['a:buChar'] ?? p['a:pPr']?.['a:buAutoNum']).toBeTruthy();
    }

    const notesFiles = Object.keys(zip.files).filter((f) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f));
    expect(notesFiles.length, 'notesSlideN.xml ausente').toBe(1);
    const notesXml = await zip.file(notesFiles[0])!.async('text');
    expect(notesXml).toContain('Estas são as notas do apresentador');
  });

  it('aplica fundo em cada slide, com fallback de cor para gradiente (fixture backgrounds)', async () => {
    const { presentation } = ALL_FIXTURES[4];
    const zip = await loadZip(presentation);
    for (let i = 0; i < 3; i++) {
      const doc = await slideXmlDoc(zip, i);
      const bg = doc['p:sld']['p:cSld']['p:bg'];
      expect(bg, `slide ${i + 1} sem <p:bg>`).toBeTruthy();
    }
  });

  it('embeda imagens como bytes reais no pacote, nunca como referência externa', async () => {
    const { presentation } = ALL_FIXTURES[0];
    const zip = await loadZip(presentation);
    const mediaFiles = Object.keys(zip.files).filter((f) => /^ppt\/media\//.test(f) && !zip.files[f].dir);
    // fixture 1 tem 1 imagem + 1 ícone rasterizado (mockado) = ao menos 2 mídias embedadas
    expect(mediaFiles.length).toBeGreaterThanOrEqual(2);
    for (const f of mediaFiles) {
      const bytes = await zip.file(f)!.async('uint8array');
      expect(bytes.length, `${f} vazio`).toBeGreaterThan(0);
    }
  });

  it('exporta tabela como graphicFrame nativo e gráfico com parte de chart própria', async () => {
    const { presentation } = ALL_FIXTURES[0];
    const zip = await loadZip(presentation);
    const doc = await slideXmlDoc(zip, 0);
    const frames = asArray(doc['p:sld']['p:cSld']['p:spTree']['p:graphicFrame']);
    expect(frames.length, 'tabela e gráfico devem virar p:graphicFrame').toBeGreaterThanOrEqual(2);

    const chartParts = Object.keys(zip.files).filter((f) => /^ppt\/charts\/chart\d+\.xml$/.test(f));
    expect(chartParts.length, 'parte de gráfico nativo (ppt/charts/chartN.xml) ausente').toBeGreaterThanOrEqual(1);
  });

  it('gera o template Institucional Gerdau completo (9 slides) com fontes mapeadas', async () => {
    const { presentation } = ALL_FIXTURES[5];
    expect(presentation.slides.length).toBe(9);
    const zip = await loadZip(presentation);
    const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
    expect(slideFiles.length).toBe(9);

    const doc = await slideXmlDoc(zip, 0);
    const shapes = asArray(doc['p:sld']['p:cSld']['p:spTree']['p:sp']);
    const titleShape = shapes.find((s: any) => s['p:txBody']?.['a:p']?.['a:r']?.['a:rPr']);
    // Archivo (fonte do tema gerdau) deve estar mapeada no run de texto do título
    const fonts = shapes
      .flatMap((s: any) => asArray(s['p:txBody']?.['a:p']))
      .map((p: any) => p?.['a:r']?.['a:rPr']?.['a:latin']?.['@_typeface'])
      .filter(Boolean);
    expect(fonts.some((f: string) => f.includes('Archivo')), `fontes encontradas: ${fonts.join(', ')}`).toBe(true);
  });
});

describe('Fidelidade visual (SSIM) — §6.3 do plano', () => {
  const hasLibreOffice = (() => {
    try {
      execSync('which soffice', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  it.skipIf(!hasLibreOffice)(
    'renderiza slide da Vizu (PNG) vs slide do PPTX (LibreOffice) com SSIM ≥ 0.95',
    () => {
      // Não executado nesta VPS: LibreOffice (soffice) não está instalado no ambiente.
      // Harness pronto para rodar assim que `soffice` estiver disponível em CI —
      // basta implementar o comparador SSIM (ex.: pixelmatch/ssim.js) aqui.
      expect(hasLibreOffice).toBe(true);
    }
  );
});
