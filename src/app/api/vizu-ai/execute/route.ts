import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import type {
  Presentation,
  Slide,
  SlideElement,
  TextElement,
  ShapeElement,
  IconElement,
  ImageElement,
  LineElement,
  LayoutType,
} from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';
import { DEFAULT_THEMES } from '@/lib/themes';
import { buildSlideFromSpec } from '@/lib/templates';

// ─── Tipos de Comando ────────────────────────────────────────────────────────

export type Comando =
  | CriarApresentacaoCmd
  | DefinirTituloCmd
  | DefinirTemaCmd
  | AdicionarSlideCmd
  | RemoverSlideCmd
  | DuplicarSlideCmd
  | MoverSlideCmd
  | ReordenarSlidesCmd
  | EditarSlideCmd
  | AdicionarElementoCmd
  | EditarElementoCmd
  | RemoverElementoCmd;

interface CriarApresentacaoCmd {
  cmd: 'criar_apresentacao';
  nome: string;
  tema?: string;
  autor?: string;
  descricao?: string;
  tags?: string[];
}

interface DefinirTituloCmd {
  cmd: 'definir_titulo';
  titulo: string;
}

interface DefinirTemaCmd {
  cmd: 'definir_tema';
  tema: string;
  cores?: Partial<import('@/types/slide').ThemeColors>;
  fontes?: { heading?: string; body?: string };
}

interface DadosSlide {
  titulo?: string;       // → title
  subtitulo?: string;    // → subtitle
  autor?: string;        // → author
  data?: string;         // → date
  bullets?: string[];    // → bullets
  conteudo?: string;     // → content
  titulo_esq?: string;   // → leftTitle
  conteudo_esq?: string; // → leftContent
  titulo_dir?: string;   // → rightTitle
  conteudo_dir?: string; // → rightContent
  citacao?: string;      // → quote
  atribuicao?: string;   // → attribution
  // campos em inglês também aceitos
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  content?: string;
  leftTitle?: string;
  leftContent?: string;
  rightTitle?: string;
  rightContent?: string;
  quote?: string;
  attribution?: string;
}

interface AdicionarSlideCmd {
  cmd: 'adicionar_slide';
  layout: LayoutType;
  dados?: DadosSlide;
  background?: Partial<import('@/types/slide').SlideBackground>;
  posicao?: number;
}

interface RemoverSlideCmd {
  cmd: 'remover_slide';
  slide_id?: string;
  slide_indice?: number;
}

interface DuplicarSlideCmd {
  cmd: 'duplicar_slide';
  slide_id?: string;
  slide_indice?: number;
}

interface MoverSlideCmd {
  cmd: 'mover_slide';
  slide_id?: string;
  slide_indice?: number;
  para_posicao: number;
}

interface ReordenarSlidesCmd {
  cmd: 'reordenar_slides';
  ordem: string[];
}

interface EditarSlideCmd {
  cmd: 'editar_slide';
  slide_id?: string;
  slide_indice?: number;
  background?: Partial<import('@/types/slide').SlideBackground>;
  notas?: string;
}

type PosicaoSemantica =
  | 'centro'
  | 'topo'
  | 'rodape'
  | 'col_esquerda'
  | 'col_direita'
  | 'topo_esquerda'
  | 'topo_direita'
  | 'canto_inferior_esq'
  | 'canto_inferior_dir'
  | 'largura_total'
  | 'area_conteudo';

interface PropsElemento {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  posicao?: PosicaoSemantica;
  rotacao?: number;       // → rotation
  opacidade?: number;     // → opacity
  camada?: number;        // → zIndex
  travado?: boolean;      // → locked
  visivel?: boolean;      // → visible
  // TextElement
  conteudo?: string;      // → content
  estilo?: Partial<import('@/types/slide').TextStyle>;
  fundo?: string;         // → background
  borda?: Partial<import('@/types/slide').BorderStyle>;
  padding?: number;
  alinhamento_vertical?: 'top' | 'middle' | 'bottom';
  // ShapeElement
  forma?: import('@/types/slide').ShapeType;
  preenchimento?: string; // → fill
  sombra?: Partial<import('@/types/slide').ShadowStyle>;
  // IconElement
  nome_icone?: string;    // → iconName
  cor?: string;           // → color
  // ImageElement
  src?: string;
  alt?: string;
  ajuste?: 'cover' | 'contain' | 'fill';
  // LineElement
  espessura?: number;     // → thickness
  estilo_linha?: 'solid' | 'dashed' | 'dotted';
  seta_inicio?: boolean;  // → arrowStart
  seta_fim?: boolean;     // → arrowEnd
  // campos inglês também aceitos
  [key: string]: unknown;
}

interface AdicionarElementoCmd {
  cmd: 'adicionar_elemento';
  slide_id?: string;
  slide_indice?: number;
  tipo: import('@/types/slide').ElementType;
  props: PropsElemento;
}

interface EditarElementoCmd {
  cmd: 'editar_elemento';
  slide_id?: string;
  slide_indice?: number;
  elemento_id?: string;
  elemento_indice?: number;
  props: Record<string, unknown>;
}

interface RemoverElementoCmd {
  cmd: 'remover_elemento';
  slide_id?: string;
  slide_indice?: number;
  elemento_id?: string;
  elemento_indice?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const POSICOES: Record<PosicaoSemantica, { x: number; y: number; width: number; height: number }> = {
  centro:              { x: 280, y: 170, width: 400, height: 200 },
  topo:                { x: 80,  y: 40,  width: 800, height: 80  },
  rodape:              { x: 80,  y: 460, width: 800, height: 60  },
  col_esquerda:        { x: 40,  y: 120, width: 420, height: 360 },
  col_direita:         { x: 500, y: 120, width: 420, height: 360 },
  topo_esquerda:       { x: 40,  y: 40,  width: 400, height: 200 },
  topo_direita:        { x: 520, y: 40,  width: 400, height: 200 },
  canto_inferior_esq:  { x: 40,  y: 380, width: 300, height: 120 },
  canto_inferior_dir:  { x: 620, y: 380, width: 300, height: 120 },
  largura_total:       { x: 0,   y: 120, width: 960, height: 300 },
  area_conteudo:       { x: 80,  y: 120, width: 800, height: 360 },
};

function traduzirDados(d: DadosSlide): import('@/types/slide').AISlideSpec['data'] {
  return {
    title:        d.titulo       ?? d.title,
    subtitle:     d.subtitulo    ?? d.subtitle,
    author:       d.autor        ?? d.author,
    date:         d.data         ?? d.date,
    bullets:      d.bullets,
    content:      d.conteudo     ?? d.content,
    leftTitle:    d.titulo_esq   ?? d.leftTitle,
    leftContent:  d.conteudo_esq ?? d.leftContent,
    rightTitle:   d.titulo_dir   ?? d.rightTitle,
    rightContent: d.conteudo_dir ?? d.rightContent,
    quote:        d.citacao      ?? d.quote,
    attribution:  d.atribuicao   ?? d.attribution,
  };
}

function traduzirPropsElemento(props: PropsElemento): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  // Posição semântica → pixels
  if (props.posicao && POSICOES[props.posicao]) {
    const pos = POSICOES[props.posicao];
    if (props.x === undefined) out.x = pos.x;
    if (props.y === undefined) out.y = pos.y;
    if (props.width === undefined) out.width = pos.width;
    if (props.height === undefined) out.height = pos.height;
  }

  // Campos em português → inglês
  if (props.x !== undefined) out.x = props.x;
  if (props.y !== undefined) out.y = props.y;
  if (props.width !== undefined) out.width = props.width;
  if (props.height !== undefined) out.height = props.height;
  if (props.rotacao !== undefined) out.rotation = props.rotacao;
  if (props.opacidade !== undefined) out.opacity = props.opacidade;
  if (props.camada !== undefined) out.zIndex = props.camada;
  if (props.travado !== undefined) out.locked = props.travado;
  if (props.visivel !== undefined) out.visible = props.visivel;
  if (props.conteudo !== undefined) out.content = props.conteudo;
  if (props.estilo !== undefined) out.style = props.estilo;
  if (props.fundo !== undefined) out.background = props.fundo;
  if (props.borda !== undefined) out.border = props.borda;
  if (props.padding !== undefined) out.padding = props.padding;
  if (props.alinhamento_vertical !== undefined) out.verticalAlign = props.alinhamento_vertical;
  if (props.forma !== undefined) out.shape = props.forma;
  if (props.preenchimento !== undefined) out.fill = props.preenchimento;
  if (props.sombra !== undefined) out.shadow = props.sombra;
  if (props.nome_icone !== undefined) out.iconName = props.nome_icone;
  if (props.cor !== undefined) out.color = props.cor;
  if (props.src !== undefined) out.src = props.src;
  if (props.alt !== undefined) out.alt = props.alt;
  if (props.ajuste !== undefined) out.objectFit = props.ajuste;
  if (props.espessura !== undefined) out.thickness = props.espessura;
  if (props.estilo_linha !== undefined) out.style = props.estilo_linha;
  if (props.seta_inicio !== undefined) out.arrowStart = props.seta_inicio;
  if (props.seta_fim !== undefined) out.arrowEnd = props.seta_fim;

  // Pass-through de campos em inglês não mapeados
  const camposPt = new Set([
    'posicao', 'rotacao', 'opacidade', 'camada', 'travado', 'visivel',
    'conteudo', 'estilo', 'fundo', 'borda', 'alinhamento_vertical',
    'forma', 'preenchimento', 'sombra', 'nome_icone', 'cor',
    'ajuste', 'espessura', 'estilo_linha', 'seta_inicio', 'seta_fim',
  ]);
  for (const [k, v] of Object.entries(props)) {
    if (!camposPt.has(k) && !(k in out)) {
      out[k] = v;
    }
  }

  return out;
}

function criarElementoPadrao(tipo: import('@/types/slide').ElementType, propsRaw: PropsElemento): SlideElement {
  const mapped = traduzirPropsElemento(propsRaw);
  const id = uuid();
  const base = {
    id,
    type: tipo,
    x: (mapped.x as number) ?? 80,
    y: (mapped.y as number) ?? 80,
    width: (mapped.width as number) ?? 200,
    height: (mapped.height as number) ?? 60,
    rotation: (mapped.rotation as number) ?? 0,
    opacity: (mapped.opacity as number) ?? 1,
    zIndex: (mapped.zIndex as number) ?? 5,
    locked: (mapped.locked as boolean) ?? false,
    visible: (mapped.visible as boolean) ?? true,
  };

  switch (tipo) {
    case 'text': {
      const el: TextElement = {
        ...base,
        type: 'text',
        content: (mapped.content as string) ?? '',
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
          ...((mapped.style as object) ?? {}),
        },
        background: (mapped.background as string) ?? 'transparent',
        border: { width: 0, color: 'transparent', style: 'none', radius: 0, ...((mapped.border as object) ?? {}) },
        padding: (mapped.padding as number) ?? 8,
        verticalAlign: (mapped.verticalAlign as 'top' | 'middle' | 'bottom') ?? 'middle',
      };
      return el;
    }

    case 'shape': {
      const el: ShapeElement = {
        ...base,
        type: 'shape',
        shape: (mapped.shape as import('@/types/slide').ShapeType) ?? 'rectangle',
        fill: (mapped.fill as string) ?? '#3b82f6',
        border: { width: 0, color: 'transparent', style: 'none', radius: 0, ...((mapped.border as object) ?? {}) },
        shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)', ...((mapped.shadow as object) ?? {}) },
      };
      return el;
    }

    case 'icon': {
      const el: IconElement = {
        ...base,
        type: 'icon',
        iconName: (mapped.iconName as string) ?? 'Star',
        color: (mapped.color as string) ?? '#3b82f6',
        background: (mapped.background as string) ?? 'transparent',
        border: { width: 0, color: 'transparent', style: 'none', radius: 0, ...((mapped.border as object) ?? {}) },
      };
      return el;
    }

    case 'image': {
      const el: ImageElement = {
        ...base,
        type: 'image',
        src: (mapped.src as string) ?? '',
        alt: (mapped.alt as string) ?? '',
        objectFit: (mapped.objectFit as 'cover' | 'contain' | 'fill') ?? 'cover',
        border: { width: 0, color: 'transparent', style: 'none', radius: 0, ...((mapped.border as object) ?? {}) },
        shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)', ...((mapped.shadow as object) ?? {}) },
      };
      return el;
    }

    case 'line': {
      const el: LineElement = {
        ...base,
        type: 'line',
        color: (mapped.color as string) ?? '#e2e8f0',
        thickness: (mapped.thickness as number) ?? 2,
        style: (mapped.style as 'solid' | 'dashed' | 'dotted') ?? 'solid',
        arrowStart: (mapped.arrowStart as boolean) ?? false,
        arrowEnd: (mapped.arrowEnd as boolean) ?? false,
      };
      return el;
    }

    default:
      throw new Error(`Tipo de elemento inválido: "${tipo}". Valores válidos: text, shape, icon, image, line`);
  }
}

function resolverSlide(apresentacao: Presentation, slide_id?: string, slide_indice?: number): Slide | null {
  if (slide_id) return apresentacao.slides.find((s) => s.id === slide_id) ?? null;
  const idx = slide_indice ?? (apresentacao.slides.length - 1);
  return apresentacao.slides[idx] ?? null;
}

function resolverElemento(slide: Slide, elemento_id?: string, elemento_indice?: number): SlideElement | null {
  if (elemento_id) return slide.elements.find((e) => e.id === elemento_id) ?? null;
  if (elemento_indice !== undefined) return slide.elements[elemento_indice] ?? null;
  return null;
}

function clonarSlideComNovosIds(slide: Slide): Slide {
  return {
    ...slide,
    id: uuid(),
    elements: slide.elements.map((el) => ({ ...el, id: uuid() })),
  };
}

// ─── Executor ────────────────────────────────────────────────────────────────

function executarComandos(
  comandos: Comando[],
  apresentacaoInicial?: Presentation
): { apresentacao: Presentation; log: string[]; erros: string[] } {
  const log: string[] = [];
  const erros: string[] = [];
  const now = new Date().toISOString();

  let p: Presentation = apresentacaoInicial ?? {
    id: uuid(),
    title: 'Nova Apresentação',
    theme: DEFAULT_THEMES[0],
    slides: [],
    metadata: { createdAt: now, updatedAt: now, version: '1.0' },
  };

  for (let i = 0; i < comandos.length; i++) {
    const cmd = comandos[i];
    try {
      switch (cmd.cmd) {

        case 'criar_apresentacao': {
          const tema = cmd.tema ? (DEFAULT_THEMES.find((t) => t.id === cmd.tema) ?? DEFAULT_THEMES[0]) : DEFAULT_THEMES[0];
          p = {
            id: uuid(),
            title: cmd.nome,
            theme: tema,
            slides: [],
            metadata: {
              createdAt: now,
              updatedAt: now,
              version: '1.0',
              author: cmd.autor,
              description: cmd.descricao,
              tags: cmd.tags,
            },
          };
          log.push(`[${i}] criar_apresentacao: "${cmd.nome}", tema="${tema.id}"`);
          break;
        }

        case 'definir_titulo': {
          p = { ...p, title: cmd.titulo };
          log.push(`[${i}] definir_titulo: "${cmd.titulo}"`);
          break;
        }

        case 'definir_tema': {
          const base = DEFAULT_THEMES.find((t) => t.id === cmd.tema) ?? p.theme;
          const tema = {
            ...base,
            colors: { ...base.colors, ...(cmd.cores ?? {}) },
            fonts: { ...base.fonts, ...(cmd.fontes ?? {}) },
          };
          p = { ...p, theme: tema };
          log.push(`[${i}] definir_tema: "${base.id}"`);
          break;
        }

        case 'adicionar_slide': {
          const dados = traduzirDados(cmd.dados ?? {});
          const novoSlide = buildSlideFromSpec(
            { layout: cmd.layout, data: dados, background: cmd.background },
            p.theme
          );
          const slides = [...p.slides];
          const posicao = cmd.posicao ?? slides.length;
          slides.splice(posicao, 0, novoSlide);
          p = { ...p, slides };
          log.push(`[${i}] adicionar_slide: layout="${cmd.layout}", id="${novoSlide.id}", posicao=${posicao}`);
          break;
        }

        case 'remover_slide': {
          const alvo = resolverSlide(p, cmd.slide_id, cmd.slide_indice);
          if (!alvo) { erros.push(`[${i}] remover_slide: slide não encontrado`); break; }
          p = { ...p, slides: p.slides.filter((s) => s.id !== alvo.id) };
          log.push(`[${i}] remover_slide: id="${alvo.id}"`);
          break;
        }

        case 'duplicar_slide': {
          const alvo = resolverSlide(p, cmd.slide_id, cmd.slide_indice);
          if (!alvo) { erros.push(`[${i}] duplicar_slide: slide não encontrado`); break; }
          const clone = clonarSlideComNovosIds(alvo);
          const idx = p.slides.findIndex((s) => s.id === alvo.id);
          const slides = [...p.slides];
          slides.splice(idx + 1, 0, clone);
          p = { ...p, slides };
          log.push(`[${i}] duplicar_slide: original="${alvo.id}", clone="${clone.id}"`);
          break;
        }

        case 'mover_slide': {
          const alvo = resolverSlide(p, cmd.slide_id, cmd.slide_indice);
          if (!alvo) { erros.push(`[${i}] mover_slide: slide não encontrado`); break; }
          const slides = p.slides.filter((s) => s.id !== alvo.id);
          slides.splice(cmd.para_posicao, 0, alvo);
          p = { ...p, slides };
          log.push(`[${i}] mover_slide: id="${alvo.id}", para=${cmd.para_posicao}`);
          break;
        }

        case 'reordenar_slides': {
          const mapa = new Map(p.slides.map((s) => [s.id, s]));
          const reordenados = cmd.ordem.map((id) => mapa.get(id)).filter(Boolean) as Slide[];
          p = { ...p, slides: reordenados };
          log.push(`[${i}] reordenar_slides: ${cmd.ordem.length} slides`);
          break;
        }

        case 'editar_slide': {
          const alvo = resolverSlide(p, cmd.slide_id, cmd.slide_indice);
          if (!alvo) { erros.push(`[${i}] editar_slide: slide não encontrado`); break; }
          p = {
            ...p,
            slides: p.slides.map((s) =>
              s.id === alvo.id
                ? {
                    ...s,
                    ...(cmd.background ? { background: { ...s.background, ...cmd.background } } : {}),
                    ...(cmd.notas !== undefined ? { notes: cmd.notas } : {}),
                  }
                : s
            ),
          };
          log.push(`[${i}] editar_slide: id="${alvo.id}"`);
          break;
        }

        case 'adicionar_elemento': {
          const slide = resolverSlide(p, cmd.slide_id, cmd.slide_indice);
          if (!slide) { erros.push(`[${i}] adicionar_elemento: slide não encontrado`); break; }
          const novoEl = criarElementoPadrao(cmd.tipo, cmd.props);
          p = {
            ...p,
            slides: p.slides.map((s) =>
              s.id === slide.id ? { ...s, elements: [...s.elements, novoEl] } : s
            ),
          };
          log.push(`[${i}] adicionar_elemento: tipo="${cmd.tipo}", id="${novoEl.id}", slide="${slide.id}"`);
          break;
        }

        case 'editar_elemento': {
          const slide = resolverSlide(p, cmd.slide_id, cmd.slide_indice);
          if (!slide) { erros.push(`[${i}] editar_elemento: slide não encontrado`); break; }
          const el = resolverElemento(slide, cmd.elemento_id, cmd.elemento_indice);
          if (!el) { erros.push(`[${i}] editar_elemento: elemento não encontrado`); break; }
          p = {
            ...p,
            slides: p.slides.map((s) =>
              s.id === slide.id
                ? {
                    ...s,
                    elements: s.elements.map((e) =>
                      e.id === el.id ? deepMerge(e as unknown as Record<string, unknown>, cmd.props) as unknown as SlideElement : e
                    ),
                  }
                : s
            ),
          };
          log.push(`[${i}] editar_elemento: id="${el.id}", slide="${slide.id}"`);
          break;
        }

        case 'remover_elemento': {
          const slide = resolverSlide(p, cmd.slide_id, cmd.slide_indice);
          if (!slide) { erros.push(`[${i}] remover_elemento: slide não encontrado`); break; }
          const el = resolverElemento(slide, cmd.elemento_id, cmd.elemento_indice);
          if (!el) { erros.push(`[${i}] remover_elemento: elemento não encontrado`); break; }
          p = {
            ...p,
            slides: p.slides.map((s) =>
              s.id === slide.id
                ? { ...s, elements: s.elements.filter((e) => e.id !== el.id) }
                : s
            ),
          };
          log.push(`[${i}] remover_elemento: id="${el.id}", slide="${slide.id}"`);
          break;
        }

        default:
          erros.push(`[${i}] Comando desconhecido: "${(cmd as { cmd: string }).cmd}"`);
      }
    } catch (err) {
      erros.push(`[${i}] Erro em "${(cmd as { cmd: string }).cmd}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  p = { ...p, metadata: { ...p.metadata, updatedAt: new Date().toISOString() } };
  return { apresentacao: p, log, erros };
}

function deepMerge(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && typeof result[k] === 'object' && result[k] !== null) {
      result[k] = deepMerge(result[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

/**
 * POST /api/vizu-ai/execute
 *
 * Executa uma sequência de comandos estruturados para criar ou modificar uma apresentação.
 * Retorna o JSON completo da apresentação resultante.
 *
 * Body:
 * {
 *   "comandos": Comando[],          // obrigatório
 *   "apresentacao": Presentation    // opcional — apresentação inicial para modificação
 * }
 *
 * Exemplo mínimo:
 * {
 *   "comandos": [
 *     { "cmd": "criar_apresentacao", "nome": "Estratégia Q3", "tema": "midnight" },
 *     { "cmd": "adicionar_slide", "layout": "cover", "dados": { "titulo": "Q3 2026", "subtitulo": "Revisão Estratégica" } },
 *     { "cmd": "adicionar_slide", "layout": "content", "dados": { "titulo": "Resultados", "bullets": ["Meta atingida", "NPS 82"] } },
 *     { "cmd": "adicionar_slide", "layout": "closing", "dados": { "titulo": "Obrigado", "subtitulo": "Dúvidas?" } }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      comandos: Comando[];
      apresentacao?: Presentation;
    };

    if (!Array.isArray(body.comandos) || body.comandos.length === 0) {
      return NextResponse.json(
        { erro: 'O campo "comandos" é obrigatório e deve ser um array não vazio.' },
        { status: 400 }
      );
    }

    const { apresentacao, log, erros } = executarComandos(body.comandos, body.apresentacao);

    if (erros.length > 0 && apresentacao.slides.length === 0) {
      return NextResponse.json({ erro: 'Falha na execução dos comandos.', erros, log }, { status: 422 });
    }

    return NextResponse.json(
      { apresentacao, log, erros, total_slides: apresentacao.slides.length },
      { status: erros.length > 0 ? 207 : 200 }
    );
  } catch (err) {
    console.error('[vizu-ai/execute]', err);
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 });
  }
}
